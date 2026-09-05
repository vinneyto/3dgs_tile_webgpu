export declare const compactMortonBitsWGSL = "\nfn compact_morton_bits_16(value: u32) -> u32 {\n  var result = value & 0x55555555u;\n  result = (result | (result >> 1u)) & 0x33333333u;\n  result = (result | (result >> 2u)) & 0x0f0f0f0fu;\n  result = (result | (result >> 4u)) & 0x00ff00ffu;\n  result = (result | (result >> 8u)) & 0x0000ffffu;\n  return result;\n}\n";
export declare function createWorkgroupUniformLoadWGSL(size?: number): string;
export declare const workgroupUniformLoadWGSL: string;
