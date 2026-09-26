export declare const scanBlocksWGSL: string;
export declare const scanVisibilityBlocksWGSL: string;
export declare const addScanOffsetsWGSL = "\nfn add_scan_offsets(\n  index: u32,\n  length: u32,\n  values: ptr<storage, array<u32>, read_write>,\n  block_offsets: ptr<storage, array<u32>, read>\n) -> u32 {\n  if (index < length) {\n    (*values)[index] += (*block_offsets)[index / 512u];\n  }\n  return 0u;\n}\n";
