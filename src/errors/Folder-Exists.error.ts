export class FolderExistError extends Error {
    constructor(message: string = 'Folder already exists') {
      super(message);
  
      this.name = 'FolderExistError';
    }
  }