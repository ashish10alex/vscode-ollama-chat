import * as vscode from 'vscode';
import { execSync } from 'child_process';


export function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


export function getDefaultModel(availableModels: string[]): string | undefined {
    const config = vscode.workspace.getConfiguration('ollama-chat');
    const configuredModel = config.get<string>('defaultModel');

    const serverUrl = config.get<string>('serverUrl') || 'http://localhost:11434';
    if(serverUrl === 'http://localhost:11434'){
        return configuredModel;
    }

    if (configuredModel && availableModels.includes(configuredModel)) {
        return configuredModel;
    }

    return availableModels.length >= 1 ? availableModels[0] : undefined;
}


export function executableIsAvailable(name: string) {
    const shell = (cmd: string) => execSync(cmd, { encoding: 'utf8' });
    const command = isRunningOnWindows ? "where.exe" : "which";
    try { shell(`${command} ${name}`); return true; }
    catch (error) {
    vscode.window.showErrorMessage(`${name} cli not found in path`, "Installation steps").then(selection => {
        if (selection === "Installation steps") {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/ashish10alex/vscode-ollama-chat?tab=readme-ov-file#how-to-use-"));
        }
    });
    return false;
    }
}

/**
 * Parsses output of `ollama list` command to extract available model names.
 *
 * @function getAvaialableModels
 * @description Processes the tabular output from `ollama list` command, skipping headers and empty lines,
 *              to return an array of available model names.
 * @returns {string[]} Array of model names in 'NAME:VERSION' format
 * @example
 * // Returns: ['qwen2.5-coder:latest', 'deepseek-r1:8b', 'deepseek-r1:1.5b']
 * getAvaialableModels();
 */
export function getAvaialableModels() {
    let modelsData = execSync('ollama list').toString();
    return modelsData.split('\n')
        .slice(1) // Remove header row containing columns
        .filter(line => line.trim()) // Remove empty lines
        .map(line => {
            const columns = line.trim().split(/\s{2,}/); // Split by 2+ spaces
            return columns[0]; // First column contains model name
        });
}


export const systemPromptContent = `You are a helpful AI assistant. When providing information:
    1. Ensure your response is clear, concise, and directly addresses the user's query
    2. Include relevant links in markdown format: [text_of_link](address_to_resource)
    3. Add a "## Resources" header in markdown format above the links
    4. Only include links for reliable sources you've used to inform your answer
    5. If no specific resources were used, omit the Resources section
`;
