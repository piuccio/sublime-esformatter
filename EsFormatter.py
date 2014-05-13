import sublime, sublime_plugin, subprocess, threading, json, re, platform, sys, os

ON_WINDOWS = platform.system() is 'Windows'
ST2 = sys.version_info < (3, 0)
NODE = None

if not ON_WINDOWS:
    # Extend Path to catch Node installed via HomeBrew
    os.environ['PATH'] += ':/usr/local/bin'

class EsformatterCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        if (NODE.mightWork() == False):
            return

        # Settings for formatting
        settings = sublime.load_settings("EsFormatter.sublime-settings")
        format_options = json.dumps(settings.get("format_options"))

        if (len(self.view.sel()) == 1 and self.view.sel()[0].empty()):
            # Only one caret and no text selected, format the whole file
            textContent = self.view.substr(sublime.Region(0, self.view.size()))
            thread = NodeCall(textContent.encode('utf-8'), format_options)
            thread.start()
            self.handle_thread(thread, lambda: self.replaceFile(thread))
        else:
            # Format each and every selection block
            threads = []
            for selection in self.view.sel():
                # Take everything from the beginning to the end of line
                region = self.view.line(selection)
                textContent = self.view.substr(region)
                thread = NodeCall(textContent.encode('utf-8'), format_options, len(threads), region)
                threads.append(thread)
                thread.start()

            self.handle_threads(threads, lambda process, lastError: self.handleSyntaxErrors(process, lastError, format_options))


    def replaceFile(self, thread):
        '''Replace the entire file content with the formatted text.'''
        self.view.run_command("esformat_update_content", {"text": thread.result})
        sublime.status_message("File formatted")


    def handleSyntaxErrors(self, threads=None, lastError=None, format_options=''):
        '''When formatting whole lines there might be a syntax error because we select
        the whole line content. In that case, fall-back to the user selection.'''
        if (lastError is None and threads is not None):
            self.replaceSelections(threads, None)
        else:
            # Format each and every selection block
            threads = []
            for selection in self.view.sel():
                # Take only the user selection
                textContent = self.view.substr(selection)
                thread = NodeCall(textContent, format_options, len(threads), selection)
                threads.append(thread)
                thread.start()

            self.handle_threads(threads, lambda process, lastError: self.replaceSelections(process, lastError))


    def replaceSelections(self, threads, lastError):
        '''Replace the content of a list of selections.
        This is called when there are multiple cursors or a selection of text'''
        if (lastError):
            sublime.error_message("Error (2):" + lastError)
        else:
            # Modify the selections from top to bottom to account for different text length
            offset = 0
            regions = []
            for thread in sorted(threads, key=lambda t: t.region.begin()):
                if offset:
                    region = [thread.region.begin() + offset, thread.region.end() + offset, thread.result]
                else:
                    region = [thread.region.begin(), thread.region.end(), thread.result]
                offset += len(thread.result) - len(thread.code)
                regions.append(region)
            self.view.run_command("esformat_update_content", {"regions": regions})


    def handle_thread(self, thread, callback):
        if thread.is_alive():
            sublime.set_timeout(lambda: self.handle_thread(thread, callback), 100)
        elif thread.result is not False:
            callback()
        else:
            sublime.error_message("Error (1):" + thread.error)

    def handle_threads(self, threads, callback, process=False, lastError=None):
        next_threads = []
        if process is False:
            process = []

        for thread in threads:
            if thread.is_alive():
                next_threads.append(thread)
                continue
            if thread.result is False:
                # This thread failed
                lastError = thread.error
                continue
            # Thread completed correctly
            process.append(thread)

        if len(next_threads):
            # Some more threads to wait
            sublime.set_timeout(lambda: self.handle_threads(next_threads, callback, process, lastError), 100)
        else:
            callback(process, lastError)


class NodeCall(threading.Thread):
    def __init__(self, code, options, id=0, region=None):
        self.code = code
        self.region = region
        exec_path = os.path.join(sublime.packages_path(), "EsFormatter", "lib", "esformatter.js")
        self.cmd = getNodeCommand(exec_path, options)
        self.result = None
        threading.Thread.__init__(self)

    def run(self):
        try:
            process = subprocess.Popen(self.cmd, bufsize=160*len(self.code), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, startupinfo=getStartupInfo())
            if ST2:
                stdout, stderr = process.communicate(self.code)
                self.result = re.sub(r'(\r|\r\n|\n)\Z', '', stdout).decode('utf-8')
            else:
                stdout, stderr = process.communicate(self.code)
                self.result = re.sub(r'(\r|\r\n|\n)\Z', '', str(stdout, encoding='utf-8'))

            if stderr:
                self.result = False
                self.error = str(stderr)

        except Exception as e:
            self.result = False
            self.error = str(e)

def getStartupInfo():
    if ON_WINDOWS:
        info = subprocess.STARTUPINFO()
        info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        info.wShowWindow = subprocess.SW_HIDE
        return info
    return None

def getNodeCommand(libPath, options=None):
    if (options):
        return [NODE.nodeName, libPath, options]
    else:
        return [NODE.nodeName, libPath]

class NodeCheck:
    '''This class check whether node.js is installed and available in the path.
    The check is done only once when mightWork() is called for the first time.
    Being a tri-state class it's better not accessing it's properties but only call mightWork()'''
    def __init__(self):
        self.works = False
        self.checkDone = False
        self.nodeName = "node"

    def mightWork(self):
        if (self.checkDone):
            return self.works

        # Run node version to know if it's in the path
        try:
            subprocess.Popen(getNodeCommand("--version"), bufsize=1, stdin=None, stdout=None, stderr=None, startupinfo=getStartupInfo())
            self.works = True
        except OSError as e:
            try:
                self.nodeName = "nodejs"
                subprocess.Popen(getNodeCommand("--version"), bufsize=1, stdin=None, stdout=None, stderr=None, startupinfo=getStartupInfo())
                self.works = True
            except OSError as e:
                sublime.error_message("It looks like node is not installed.\nPlease make sure that node.js is installed and in your PATH")

        return self.works

NODE = NodeCheck()

class EsformatUpdateContent(sublime_plugin.TextCommand):
    def run(self, edit, text=None, regions=None):
        if text:
            self.view.replace(edit, sublime.Region(0, self.view.size()), text)
        else:
            for region in regions:
                self.view.replace(edit, sublime.Region(region[0], region[1]), region[2])
