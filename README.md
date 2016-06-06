# Sublime EsFormatter - Sublime Text Plugin

Sublime EsFormatter is a JavaScript formatter plugin for the text editor [SublimeText](http://www.sublimetext.com) 2/3.

It is based on [esformatter](https://github.com/millermedeiros/esformatter), an extremely configurable JavaScript formatter.

Unlike other beautifiers it gives complete control over the coding style.

# Requirements

You MUST have Node.js installed globally and included in your `$PATH`.

You can either install `esformatter` globally or under your current project's `node_modules` folder. This complicates the setup slightly but you can configure things anyway you want.

```
npm install -g esformatter
```

# Installation

Using [Sublime Package Control](http://wbond.net/sublime_packages/package_control) just search for

`EsFormatter`

## Manual installation

This is not recommended, but if you know what you're doing, go on:

Clone this repository or download and unzip inside

Mac

* `~/Library/Application Support/Sublime Text 3/Packages/EsFormatter`

Windows XP

* `C:\Documents and Settings\<user>\Application Data\Sublime Text 3\Packages\EsFormatter`

Windows 7
* `C:\Users\<user>\AppData\Roaming\Sublime Text 3\Packages\EsFormatter`

Linux

* `~/.Sublime Text 3/Packages/EsFormatter`


# Usage

The default keyboard mapping is `ctrl+alt+f` or `cmd+alt+f` (that is `super+alt+f`).

You can change the key binding at: Sublime Text -> Preferences -> Package Settings -> EsFormatter -> Key Bindings - User.

	{
	  // ES Formatter key binding
	  "keys": ["ctrl+alt+f"], "command": "esformatter"
	}

If you are using a custom keyboard mapping, you may want to add the following line in order to restore the Replace Panel default functionality.

	{ "keys": ["super+alt+f"], "command": "show_panel", "args": {"panel": "replace", "reverse": false} },


You can also run EsFormatter automatically when saving a file: Sublime Text -> Preferences -> Package settings -> EsFormatter -> Settings - User.

	{
	    // Format the file when saved
	    "format_on_save": false
	}

# Configuration

You can configure the options from `.esformatter` file, either in your project on globally in your home directory.

Refer to the configuration of [esformatter](https://github.com/millermedeiros/esformatter)

# Contribute

The python script simply calls the global version of `esformatter`. Make sure your changes work on all platforms.
