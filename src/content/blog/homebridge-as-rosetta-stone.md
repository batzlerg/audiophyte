---
author: graham
pubDatetime: 2024-09-08T11:22:13.000-07:00
modDatetime: 
title: Homebridge as Rosetta Stone
featured: true
draft: false
tags:
  - homebridge
  - automation
  - javascript
  - smarthome
description: Exploring how Homebridge plugins can help connect proprietary home automation systems to each other 
---

My home automation setup is a mutt at best, and a kludge at worst. I have a habit of collecting automatable devices without regard for their protocols or interoperability, with the assumption that there will be some way to hack them together. Great for a deep bench of projects, but not so great for plug & play.

But I don't make this assumption wantonly - we live in a golden age of home automation possibilities, largely thanks to the open source community behind projects like [Homebridge](https://developers.homebridge.io/#/).

I am running devices from multiple home automation brands/services, with nearly zero implementation overlap; each has no idea that the others exist or how to communicate with them. But each can be integrated with my Homebridge server running on a Pi Zero W (≈minimum spec threshold for Homebridge...but that's another story). So Homebridge is my Rosetta Stone, speaking in many tongues on my behalf, and translating everything into configuration compatible with Apple Homekit. 

So when I thrifted a set of unused [Teckin SB50](https://www.teckinhome.com/products/teckin-sb50-1-smart-alexa-light-bulbs?variant=44283488305374) smart bulbs which use the Tuya protocol, I was pretty confident that Homebridge could help me integrate them into my setup. ([This video guide](https://www.youtube.com/watch?v=BknMmG1e7pc) ended up getting me ~90% of the way there - shoutout to Home Sight on YouTube.)

But even if everything is available inside Apple Home, I don't have an Apple TV or HomePod to unlock device automation within Apple Home itself.

## The Challenge

Coupling two devices from different protocols together so that they effectively work on the same circuit - if one goes on/off, the other does too.

## The Tools

1. Homebridge itself
1. `homebridge-plugin-automation` by grrowl ([github repo](https://github.com/grrowl/homebridge-plugin-automation))
1. a text editor or IDE

## Setup Instructions

Note: several of these instructions will require restarting Homebridge, but should prompt you when that's necessary.

1. Open your Homebridge UI in a web browser.
1. Navigate to the "Plugins" tab.
1. Search for "homebridge-plugin-automation" (hit enter, it does not search automatically)
1. Locate the plugin (you will have to scroll a bit) and install it.
1. Go to the "Settings" tab in Homebridge.
1. Scroll down and enable "Homebridge 'Insecure' Mode". This is necessary for the plugin to function correctly. You may also want to enable Debug Mode while you're here - more on that later.

![Homebridge Settings](@assets/images/homebridge-startup-options.png)

## Configuring the Automation Script

1. After Homebridge restarts, go to the "Plugins" tab.
1. Find the Homebridge Automation plugin and click on the three dots to open the plugin menu. Select Plugin Config.
1. You'll see a text editor where you can input your automation script.

![Homebridge Automation Plugin Config](@assets/images/homebridge-automation-plugin-config.png)

## The Automation Script

Here's the script we'll be using to couple the states of two accessories:

```javascript
// Define the names of the services we want to couple together.
const INITIATOR_SERVICE_NAME = ''; // e.g. "Living Room Lamp"
const RECEIVER_SERVICE_NAME = ''; // e.g. "TV Backlight" 

// Listen for events from Homebridge
automation.listen(function (event) {
  // Find the 'On' characteristic in the event
  const initiatorOnStatus = event.serviceCharacteristics.find((c) => c.type === "On");
  
  // Prepare a return value object for debugging
  const returnValue = {
    serviceName: event.serviceName,
    status: !!initiatorOnStatus
      ? (initiatorOnStatus.value ? 'turned on' : 'turned off')
      : null,
    actionTaken: false,
    message: ''
    // Uncomment the line below for more detailed debugging
    // event: JSON.stringify(event),
  };

  // Check if the event is for our initiator service
  if (event.serviceName !== INITIATOR_SERVICE_NAME) {
    returnValue.message = `event not for ${INITIATOR_SERVICE_NAME}`;
    return returnValue;
  }

  // If we have an 'On' status for the initiator
  if (initiatorOnStatus) {
    // Find the receiver service
    const receiverService = automation.services.find(
      (s) => s.serviceName === RECEIVER_SERVICE_NAME,
    );

    // Check if we found the receiver service
    if (!receiverService) {
      returnValue.message = `could not find ${RECEIVER_SERVICE_NAME}, returned: ${JSON.stringify(receiverService)}`;
      return returnValue;
    }

    // Find the 'On' characteristic for the receiver
    const receiverOnStatus = receiverService.serviceCharacteristics.find((s) => s.type === "On");
    if (!receiverOnStatus) {
      returnValue.message = `could not find receiver onStatus, returned: ${JSON.stringify(receiverOnStatus)}`;
      return returnValue;
    }

    // Set the receiver's status to match the initiator
    automation.set(receiverService.uniqueId, receiverOnStatus.iid, initiatorOnStatus.value);

    returnValue.actionTaken = true;
    returnValue.message = 'success';
    return returnValue;
  }

  return null;
});
```

## Customizing the Script

To use this script for your own devices:

1. Change `INITIATOR_SERVICE_NAME` to the name of the device you want to trigger the automation.
1. Change `RECEIVER_SERVICE_NAME` to the name of the device you want to control.
1. If you're editing outside the plugin window, make sure to paste the new vesion into the window
1. Scroll to the bottom of the window and click "Save". This will restart Homebridge and apply your changes.

Make sure these names exactly match the names of your accessories in Homebridge, including capitalization and spaces.

Caution: sometimes the serviceName is different from the device's name in Homebridge. It's helpful to enable debugging first, and turn your devices on/off so you can see their serviceName values and paste them into this script. I have also found that disabling and re-enabling the Homebridge integration plugin for a given protocol will force refresh `serviceName` to match the label, but that also means you'll have to reorganize everything back into their respective folders/rooms in Homebridge and Apple Home.

## Debugging and Fine-tuning

I was unable to get Plugin Logs for the Homebridge Automation plugin to work at all here. Accordingly, my script is debuggable via return value, which are logged in the global Homebridge logs when Debug mode is enabled:

1. Go to the Homebridge UI "Settings" tab.
1. Enable "Debug Mode"
1. Save and restart Homebridge.

![Homebridge Settings](@assets/images/homebridge-startup-options.png)

With debug mode on, you'll see detailed logs in the Homebridge log viewer. In my case, they were a little too detailed - other plugins were extremely verbose and made it difficult to audit output from our script. So instead, I regularly cleared the logs and dumped them to `.txt` file:

1. Go to the Homebridge UI "View Logs" button (the waveform icon).
1. Click the "Delete" button (the trash can icon) and confirm that you're okay clearing old logs.
1. Do the thing you want to see logs for - in my case, turning on the initiator device.
1. Click the "Download" button (the arrow pointing to disk icon) and acknowledge that you're downloading logs
1. Open the log `.txt` file that it downloads. You can search for `[HomebridgeAutomation]` to find logs from the configured script.

It's always a good idea to delete these logs when you're done with them, to prevent any logged credentials from sitting on your disk in plaintext.

![Homebridge Logs](@assets/images/homebridge-log-dump.png)

The `returnValue` object in our script provides useful information:

- `serviceName`: The name of the service that triggered the event.
- `status`: Whether the initiator was turned on or off.
- `actionTaken`: Whether the script successfully controlled the receiver.
- `message`: Additional information, especially useful for troubleshooting.

Common issues you might see in the logs:

- "event not for [INITIATOR_SERVICE_NAME]": The event was for a different accessory.
- "could not find [RECEIVER_SERVICE_NAME]": The receiver accessory name might be incorrect.
- "could not find receiver onStatus": The receiver might not have an 'On' characteristic.

## Conclusion

With this setup, whenever your initiator device turns on or off, your receiver device will do the same. This can be customized further to couple multiple devices to each other.

Remember to always save / restart Homebridge after making changes to your automation script. Happy automating!

## Additional Resources

- [`homebridge-plugin-automation` GitHub repository](https://github.com/grrowl/homebridge-plugin-automation)
- [Homebridge Documentation](https://developers.homebridge.io/)
- [Homebridge Community Forums](https://github.com/homebridge/homebridge/discussions)
- [How to setup Tuya plugin on Homebridge.](https://www.youtube.com/watch?v=BknMmG1e7pc)

Feel free to experiment with different automations and share your creations with the Homebridge community!