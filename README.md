# Ollama Chat

An **experimental** VS Code extension that allows you to use self hosted models offline that can be downloaded from [ollama](https://ollama.com/download).

<img src="./.docs/ollama-chat.gif" alt="ollam-chat-demo" width="80%">

## How to use ?

1. Install [Ollama](https://ollama.com/download) and download a model.

    ```bash
    ollama run qwen2.5-coder
    ```

2. Open  terminal and run `ollama serve` or manually open Ollama app
3. Run `Ollama Chat` comamnd in vscode command pallet this will open the chat window shown in the screenshot

## TODO

* [ ] feat: Show error if user does not have ollama started either manually via opening the app or using `ollama serve`
* [ ] feat: Show error if user does not have a model. Show them example command to install model
* [ ] fix: when asking the second question output is overwritten on the last output thread
* [ ] fix: can not scroll when the output is being rendered on VSCode webview. This might be due to the fact that html and its contents are being constantly rendered and forcing the focus to where the last content is drawn to ?
* [ ] feat: Retain context when conversating
* [ ] feat: Processes pdfs ?
* [ ] feat: Audio search
* [ ] build: Do we need to use a build system like web pack ?
