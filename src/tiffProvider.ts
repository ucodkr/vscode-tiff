import * as vscode from 'vscode';
import { TiffPreview } from './tiffPreview';

export class TiffCustomProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = 'tiff.preview';

  private readonly _previews = new Set<TiffPreview>();
  private _activePreview: TiffPreview | undefined;

  constructor(private readonly extensionRoot: vscode.Uri) {}

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    
    return { uri, dispose: (): void => {} };
  }

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewEditor: vscode.WebviewPanel
  ): Promise<void> {
    
    const preview = new TiffPreview(
      this.extensionRoot,
      document.uri,
      webviewEditor
    );
    this._previews.add(preview);
    this.setActivePreview(preview);

    webviewEditor.onDidDispose(() => {
      this._previews.delete(preview);
    });

    webviewEditor.onDidChangeViewState(() => {
      if (webviewEditor.active) {
        this.setActivePreview(preview);
      } else if (this._activePreview === preview && !webviewEditor.active) {
        this.setActivePreview(undefined);
      }
    });
  }

  public get activePreview(): TiffPreview {
    return this._activePreview;
  }

  private setActivePreview(value: TiffPreview | undefined): void {
    this._activePreview = value;
  }
}
