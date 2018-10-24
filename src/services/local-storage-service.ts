import { specSvc } from './spec-service';

/** Using the local storage to store the answers */
class LocalStorageService {
  private canStore: boolean;

  constructor() {
    this.canStore = typeof(Storage) !== 'undefined';
  }

  public load() {
    if (this.canStore) {
      const answers = localStorage.getItem(specSvc.specTitle);
      return answers ? JSON.parse(answers) : {};
    }
    return {};
  }

  public save() {
    if (this.canStore) {
      localStorage.setItem(specSvc.specTitle, JSON.stringify(specSvc.answers));
    }
  }

  public delete() {
    if (this.canStore) {
      localStorage.removeItem(specSvc.specTitle);
    }
    specSvc.answers = {};
  }

  public clear() {
    if (this.canStore) {
      localStorage.clear();
    }
  }
}

export const storageSvc = new LocalStorageService();
