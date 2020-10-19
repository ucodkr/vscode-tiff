import * as vscode from 'vscode';
import { TiffCustomProvider } from './tiffProvider';

export function activate(context: vscode.ExtensionContext): void {
  const extensionRoot = vscode.Uri.file(context.extensionPath);
  // Register our custom editor provider
  const provider = new TiffCustomProvider(extensionRoot);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      TiffCustomProvider.viewType,
      provider,
      {
        webviewOptions: {
          enableFindWidget: false, // default
          retainContextWhenHidden: true,
        },
      }
    )
  );
  context.subscriptions.push(vscode.commands.registerCommand('tiffPreview.zoomIn', () => {
		provider.activePreview?.zoomIn();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('tiffPreview.zoomOut', () => {
		provider.activePreview?.zoomOut();
	}));
}

export function deactivate(): void {}
