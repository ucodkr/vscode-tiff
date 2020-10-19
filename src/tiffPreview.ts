import * as path from 'path';
import * as vscode from 'vscode';
import { Disposable } from './disposable';

function escapeAttribute(value: string | vscode.Uri): string {
  return value.toString().replace(/"/g, '&quot;');
}

type PreviewState = 'Disposed' | 'Visible' | 'Active';


export class TiffPreview extends Disposable {
  private _previewState: PreviewState = 'Visible';

	private readonly emptyPngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42gEFAPr/AP///wAI/AL+Sr4t6gAAAABJRU5ErkJggg==';

  constructor(
    private readonly extensionRoot: vscode.Uri,
    private readonly resource: vscode.Uri,
    private readonly webviewEditor: vscode.WebviewPanel
  ) {
    super();
    const resourceRoot = resource.with({
      path: resource.path.replace(/\/[^/]+?\.\w+$/, '/'),
    });

    webviewEditor.webview.options = {
      enableScripts: true,
      localResourceRoots: [resourceRoot, extensionRoot],
    };

    this._register(
      webviewEditor.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'reopen-as-text': {
            vscode.commands.executeCommand(
              'vscode.openWith',
              resource,
              'default',
              webviewEditor.viewColumn
            );
            break;
          }
        }
      })
    );

    this._register(
      webviewEditor.onDidChangeViewState(() => {
        this.update();
        this.webviewEditor.webview.postMessage({ type: 'setActive', value: this.webviewEditor.active });
        
      })
    );

    this._register(
      webviewEditor.onDidDispose(() => {
        this._previewState = 'Disposed';
      })
    );

    const watcher = this._register(
      vscode.workspace.createFileSystemWatcher(resource.fsPath)
    );
    this._register(
      watcher.onDidChange((e) => {
        if (e.toString() === this.resource.toString()) {
          this.reload();
        }
      })
    );
    this._register(
      watcher.onDidDelete((e) => {
        if (e.toString() === this.resource.toString()) {
          this.webviewEditor.dispose();
        }
      })
    );

    this.webviewEditor.webview.html = this.getWebviewContents();
    this.update();
    this.webviewEditor.webview.postMessage({ type: 'setActive', value: this.webviewEditor.active });
  }
 
  private reload(): void {
    if (this._previewState !== 'Disposed') {
      this.webviewEditor.webview.postMessage({ type: 'reload' });
    }
  }

  private update(): void {
    if (this._previewState === 'Disposed') {
      return;
    }

    if (this.webviewEditor.active) {
      this._previewState = 'Active';
      return;
    }
    this._previewState = 'Visible';
  }

  private  getWebviewContents():  string  {
    const version = Date.now().toString();
    const webview = this.webviewEditor.webview;
    const docPath = webview.asWebviewUri(this.resource);
    const cspSource = webview.cspSource;
    const resolveAsUri = (...p: string[]): vscode.Uri => {
      const uri = vscode.Uri.file(path.join(this.extensionRoot.path, ...p));
      return webview.asWebviewUri(uri);
    };

    const config = vscode.workspace.getConfiguration('tiff-preview');
    const settings = {
      isMac: process.platform === 'darwin',
      // src: await this.getResourcePath(this.webviewEditor, this.resource, version),
      src: docPath.toString() 
    };
    const nonce = Date.now().toString();
    const html = `<!DOCTYPE html>
<html d >
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="google" content="notranslate">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${cspSource}; script-src 'unsafe-inline' ${cspSource}; style-src 'unsafe-inline' ${cspSource}; img-src blob: data: ${cspSource};">
<meta id="image-preview-settings" data-settings="${escapeAttribute(JSON.stringify(settings))}">
<title>TIFF viewer</title>
<link rel="stylesheet" href="${escapeAttribute(this.extensionResource('/tiff/main.css'))}" type="text/css" media="screen" nonce="${nonce}">
<script src="${resolveAsUri('tiff', 'tiff.min.js')}"></script>
</head> 
<body class="container image scale-to-fit loading">
  <div class="loading-indicator"></div>
  <div class="image-load-error">
    <p>"An error occurred while loading the image."</p>
    <a href="#" class="open-file-link"> "Open file using VS Code's standard text/binary editor?"</a>
  </div>
  <script src="${escapeAttribute(this.extensionResource('/tiff/tiff_loader.js'))}" nonce="${nonce}"></script>
</body>`;
 

    return html;
  }
  private async getResourcePath(webviewEditor: vscode.WebviewPanel, resource: vscode.Uri, version: string): Promise<string> {
		if (resource.scheme === 'git') {
			const stat = await vscode.workspace.fs.stat(resource);
			if (stat.size === 0) {
				return this.emptyPngDataUri;
			}
		}

		// Avoid adding cache busting if there is already a query string
		if (resource.query) {
			return webviewEditor.webview.asWebviewUri(resource).toString();
		}
		return webviewEditor.webview.asWebviewUri(resource).with({ query: `version=${version}` }).toString();
	}
	private extensionResource(path: string) {
		return this.webviewEditor.webview.asWebviewUri(this.extensionRoot.with({
			path: this.extensionRoot.path + path
		}));
  }
  public zoomIn() {
    console.log("RRR zoomIn")
		if (this._previewState === 'Active') {
			this.webviewEditor.webview.postMessage({ type: 'zoomIn' });
		}
	}

	public zoomOut() {
    console.log("RRR zoomOut")
		if (this._previewState === 'Active') {
			this.webviewEditor.webview.postMessage({ type: 'zoomOut' });
		}
	}
}
