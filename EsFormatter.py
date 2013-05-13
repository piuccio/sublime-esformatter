import sublime, sublime_plugin, subprocess, threading, json, re


class EsformatterCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        # Settings for formatting
        settings = sublime.load_settings("EsFormatter.sublime-settings")
        format_options = json.dumps(settings.get("format_options"))

        # start editing
        edit = self.view.begin_edit("esformatter")

        if (len(self.view.sel()) == 1 and self.view.sel()[0].empty()):
            # Only one caret and no text selected, format the whole file
            textContent = self.view.substr(sublime.Region(0, self.view.size()))
            thread = NodeCall(textContent, format_options)
            thread.start()
            self.handle_thread(thread, lambda: self.replaceFile(edit, thread))
        else:
            # Format each and every selection block
            threads = []
            for selection in self.view.sel():
                # Take everything from the beginning to the end of line
                region = self.view.line(selection)
                textContent = self.view.substr(region)
                thread = NodeCall(textContent, format_options, len(threads), region)
                threads.append(thread)
                thread.start()

            self.handle_threads(threads, lambda process: self.replaceSelections(edit, process))

    def replaceFile(self, edit, thread):
        '''Replace the entire file content with the formatted text.'''
        self.view.replace(edit, sublime.Region(0, self.view.size()), thread.result)
        self.view.end_edit(edit)

    def replaceSelections(self, edit, threads):
        '''Replace the content of a list of selections.
        This is called when there are multiple cursors or a selection of text'''
        # Modify the selections from top to bottom to account for different text length
        offset = 0
        for thread in sorted(threads, key=lambda t: t.region.begin()):
            region = thread.region
            if offset:
                region = sublime.Region(thread.region.begin() + offset, thread.region.end() + offset)
            self.view.replace(edit, region, thread.result)
            offset += len(thread.result) - len(thread.code)
        self.view.end_edit(edit)

    def handle_thread(self, thread, callback):
        if thread.is_alive():
            sublime.set_timeout(lambda: self.handle_thread(thread, callback), 100)
        elif thread.result is not False:
            callback()

    def handle_threads(self, threads, callback, process=False):
        next_threads = []
        if process is False:
            process = []

        for thread in threads:
            if thread.is_alive():
                next_threads.append(thread)
                continue
            if thread.result is False:
                # This thread failed
                continue
            # Thread completed correctly
            process.append(thread)

        if len(next_threads):
            # Some more threads to wait
            sublime.set_timeout(lambda: self.handle_threads(next_threads, callback, process), 100)
        else:
            callback(process)


class NodeCall(threading.Thread):
    def __init__(self, code, options, id=0, region=None):
        self.code = code
        self.region = region
        exec_path = sublime.packages_path() + "/EsFormatter/lib/esformatter.js"
        self.cmd = ["node", exec_path, options]
        self.result = None
        threading.Thread.__init__(self)

    def run(self):
        try:
            process = subprocess.Popen(self.cmd, bufsize=-1, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.SW_HIDE)
            stdout, stderr = process.communicate(self.code)
            self.result = re.sub(r'(\r|\r\n|\n)\Z', '', stdout)
            return
        except Exception as e:
            stderr = str(e)
            self.result = False

        sublime.error_message(stderr)
