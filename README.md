# Ollama Chat

An **experimental** VS Code extension that allows you to use self hosted models downloaded from [ollama](https://ollama.com/download).

<img src="./.docs/ollama-chat-demo.png" alt="ollam-chat-demo" width="80%">

## How to use ?

1. Install [Ollama](https://ollama.com/download) and download a model.

    ```bash
    ollama run qwen2.5-coder
    ```

2. Open  terminal and run `ollama serve` or manually open Ollama app
3. Run `Ollama Chat` comamnd in vscode command pallet this will open the chat window shown in the screenshot

## TODO

* [ ] Show error if user does not have ollama
* [ ] Show error if user does not have a model
* [ ] List available models in web view and make selection possible from the web view
* [ ] Retain context when conversating
* [ ] Add copy code functionality
* [ ] Can we integrate it to be used directly in a file, this would require a faster model
* [ ] Provide options for user to choose the model they want to use
* [ ] Do we need to use a build system like web pack ?
* [ ] Audio search
* [ ] Processes pdfs ?
