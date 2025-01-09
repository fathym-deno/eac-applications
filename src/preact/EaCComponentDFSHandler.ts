import { DFSFileHandler, EaCDistributedFileSystemDetails } from "./.deps.ts";

export type EaCComponentDFSHandler = {
  DFS: EaCDistributedFileSystemDetails;

  DFSLookup: string;

  Handler: DFSFileHandler;

  Extensions: string[];
};
