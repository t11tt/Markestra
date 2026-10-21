// Uncompressed ZIP: PNG is already compressed. One download contains every channel.
export function assetZip(files: {name: string; bytes: Uint8Array}[]): Blob {
  const parts: Uint8Array<ArrayBuffer>[]=[];
  const directory: Uint8Array<ArrayBuffer>[]=[];
  let offset=0, directorySize=0;
  const crc32=(bytes:Uint8Array) => {
    let crc=0xffffffff;
    for(const byte of bytes) { crc^=byte; for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1) ? 0xedb88320:0); }
    return (crc^0xffffffff)>>>0;
  };
  for(const file of files) {
    const name=new TextEncoder().encode(file.name), bytes=new Uint8Array(file.bytes), crc=crc32(bytes);
    const local=new Uint8Array(30+name.length), l=new DataView(local.buffer);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);
    const central=new Uint8Array(46+name.length),c=new DataView(central.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);central.set(name,46);
    parts.push(local,bytes);directory.push(central);offset+=local.length+bytes.length;directorySize+=central.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,directorySize,true);e.setUint32(16,offset,true);
  return new Blob([...parts,...directory,end],{type:"application/zip"});
}

export function downloadAssetPack(code:string, items:{channel:string;png:string;text:string}[]) {
  const files=items.flatMap(item=>[
    {name:`${item.channel}.png`,bytes:Uint8Array.from(atob(item.png.split(",")[1]),c=>c.charCodeAt(0))},
    {name:`${item.channel}.txt`,bytes:new TextEncoder().encode(item.text)},
  ]);
  const url=URL.createObjectURL(assetZip(files));
  const link=document.createElement("a");link.href=url;link.download=`${code}-assets.zip`;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),30_000);
}
