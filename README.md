# Sublime EsFormatter - Sublime Text Plugin

Sublime EsFormatter is a JavaScript formatter plugin for the text editor [SublimeText](http://www.sublimetext.com) 2/3.

It is based on [esformatter](https://github.com/millermedeiros/esformatter), an extremely configurable JavaScript formatter.

Unlike other beautifiers it gives complete control over the coding style.

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

The default keyboard mapping is `ctrl+alt+f` or `cmd+alf+f`.


# Configuration

Refer to the configuration of [esformatter](https://github.com/millermedeiros/esformatter)

# Contribute

The python script simply calls a bundled version of `esformatter`. To generate a new bundle it's enough to go to `lib` folder, modify `package.json` to point to the desired version of `esformatter` and run

````
EsFormatter/lib> npm install
````

To update the default sublime options simply copy the content of `node_modules/esformatter/lib/preset/default.json` inside `format_options` in file `EsFormatter.sublime-settings`.
