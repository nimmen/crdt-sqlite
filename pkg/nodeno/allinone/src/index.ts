// @ts-ignore
import Database from "better-sqlite3";
import { resolve } from "import-meta-resolve";
const modulePath = new URL(await resolve("@vlcn.io/crsqlite", import.meta.url))
  .pathname;
import { DB as IDB, Stmt as IStmt } from "@vlcn.io/xplat-api";

const api = {
  open(filename?: string, mode: string = "c"): DB {
    return new DB(filename || ":memory:");
  },
};

export class DB implements IDB {
  private db: Database;
  private open: boolean;
  constructor(private filename: string) {
    this.db = new Database(filename);
    this.db.loadExtension(modulePath);
    this.open = true;
  }

  execMany(sql: string[]): void {
    this.db.exec(sql.join(";"));
  }

  exec(sql: string, bind?: unknown | unknown[]): void {
    if (Array.isArray(bind)) {
      this.db.prepare(sql).run(...bind);
    } else {
      this.db.prepare(sql).run();
    }
  }

  execO<T extends {}>(sql: string, bind?: unknown | unknown[]): T[] {
    if (Array.isArray(bind)) {
      return this.db.prepare(sql).all(...bind);
    } else {
      return this.db.prepare(sql).all();
    }
  }

  execA<T extends any[]>(sql: string, bind?: unknown | unknown[]): T[] {
    if (Array.isArray(bind)) {
      return this.db
        .prepare(sql)
        .raw()
        .all(...bind);
    } else {
      return this.db.prepare(sql).raw().all();
    }
  }

  isOpen() {
    return this.open;
  }

  dbFilename() {
    return this.filename;
  }

  openStatementCount() {
    return -1;
  }

  prepare(sql: string): IStmt {
    const ret = this.db.prepare(sql);
    // better-sqlite3 doesn't expose a finalize? hmm..
    ret.finalize = () => {};
    return ret;
  }

  createFunction(name: string, fn: (...args: any) => unknown) {
    this.db.function(name, fn);
  }

  savepoint(cb: () => void) {
    // better-sqlite3 auto makes a tx a savepoint if nested
    this.transaction(cb);
  }

  transaction(cb: () => void) {
    const cb2 = this.db.transaction(cb);
    cb2();
  }

  close() {
    this.db.prepare("select crsql_finalize();").run();
    this.db.close();
    this.open = false;
  }
}

export default api;
