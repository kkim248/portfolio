// Cut a person out of a photo with macOS Vision (person segmentation). Writes a white-on-black mask.
//   osascript -l JavaScript scripts/segment-person.js <photo> <mask.png>
ObjC.import('Vision'); ObjC.import('AppKit'); ObjC.import('CoreImage');
function run(argv) {
  const url = $.NSURL.fileURLWithPath(argv[0]);
  const req = $.VNGeneratePersonSegmentationRequest.alloc.init;
  req.qualityLevel = 0;   // accurate
  const handler = $.VNImageRequestHandler.alloc.initWithURLOptions(url, $({}));
  const ok = handler.performRequestsError($([req]), null);
  const res = req.results;
  if (!res || res.count === 0) return 'no result ' + ok;
  const pb = res.objectAtIndex(0).pixelBuffer;
  const ci = $.CIImage.imageWithCVPixelBuffer(pb);
  const rep = $.NSCIImageRep.imageRepWithCIImage(ci);
  const img = $.NSImage.alloc.initWithSize(rep.size); img.addRepresentation(rep);
  const tiff = img.TIFFRepresentation;
  const bm = $.NSBitmapImageRep.imageRepWithData(tiff);
  bm.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $({})).writeToFileAtomically(argv[1], true);
  return 'ok ' + rep.size.width + 'x' + rep.size.height;
}
