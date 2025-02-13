# Ollama Chat

VS Code extension that allows you to chat with self hosted models offline that can be downloaded from [ollama](https://ollama.com/download).

<img src="./.docs/ollama-chat.gif" alt="ollam-chat-demo" width="80%">

## How to use ?

1. Install [Ollama](https://ollama.com/download) and download a model.

    ```bash
    ollama run qwen2.5-coder
    ```

2. Open  terminal and run `ollama serve` or manually open Ollama app
3. Open the command palette in VSCode by pressing Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux), then run the Ollama Chat command. This will open the chat window shown in the screenshot.

## TODO

* [ ] feat:  obtain avaialble models via api call instead of shell command
* [ ] feat:  show error if user does not have ollama started either manually via opening the app or using `ollama serve`
* [ ] feat:  show error if user does not have a model. Show them example command to install model
* [ ] feat:  retain context when conversation
* [ ] feat:  restrict user to certain number of tokens when sending message ?
* [ ] feat:  processes pdfs ?
* [ ] feat:  audio search
* [ ] build: Do we need to use a build system like web pack ?
