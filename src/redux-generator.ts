import * as path from 'path';
import * as fs from 'fs-extra';
import {InputBoxOptions} from 'vscode';
import {IDisposable} from './disposable.interface';
import {FolderExistError} from './errors/Folder-Exists.error';
import {VSCodeWindow} from './vscode.interfaces';

export class ReduxGenerator implements IDisposable {
    private readonly extension = '.js';

    private readonly reduxFiles = [
        'actions', 'reducer', 'epics', 
        'actions.test', 'reducer.test', 'epics.test', 'index'
    ];
    
    private readonly defaultPath = 'src/';

    constructor(private workSpaceRoot: string, private window: VSCodeWindow) {}
    async execute() : Promise<void> {
        const folderName: string | undefined = await this.prompt();
        if(!folderName) {
            return;
        }
        const absoluteFolderPath: string = this.toAbsolutePath(folderName);
        try {
            this.create(absoluteFolderPath);
            this.window.showInformationMessage(`Folder: '${folderName}' successfully created`);
        }
        catch(err) {
            if(err instanceof FolderExistError) {
                this.window.showErrorMessage(`Folder: '${folderName}' already exists`);
            }
            else {
                this.window.showErrorMessage(`Error: ${err.message}`);
            }
        }

    }

    async prompt() : Promise<string | undefined> {
        const options: InputBoxOptions = {
            ignoreFocusOut: true,
            placeHolder: 'Enter Folder Name',
            validateInput: this.validate,
            prompt: 'Folder name : \'some_folder\' or a relative path: \'src/folder\''
        };
        return await this.window.showInputBox(options);
    }

    create (absoluteFolderPath: string) {
        const folder: string = path.basename(absoluteFolderPath);

        if(fs.existsSync(absoluteFolderPath)) {
            throw new FolderExistError(`'${folder}' already exists`);
        }
        
        fs.ensureDirSync(absoluteFolderPath);

        try {
            this.reduxFiles.forEach((file: string) => {
                const filename = file === 'index' ? `${file}${this.extension}` : `_${folder}.${file}${this.extension}`;
                const fullpath = path.join(absoluteFolderPath, filename);
                fs.writeFileSync(fullpath, `/* ${filename} */`);
            });
        }
        catch(err) {
            console.log('Error', err.message);
            throw err;
        }
    }

    validate(name: string) :string | null {
        if(!name) {
            return 'Name is required';
        }
        if(name.includes(' ')) {
            return 'Spaces are not allowed';
        }
        return null;
    }

    toAbsolutePath(nameOrRelativePath:string):string {
        if(/\/|\\/.test(nameOrRelativePath)) {
            return path.resolve(this.workSpaceRoot, nameOrRelativePath);
        }
        return path.resolve(this.workSpaceRoot, this.defaultPath, nameOrRelativePath);
    }

    dispose() {}
}