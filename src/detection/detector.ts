import * as ort from "onnxruntime-node"
import sharp from "sharp"
import * as path from "node:path";

export class Detector {
    public static readonly SIZE: number = 640;
    public static readonly AREA: number = Detector.SIZE * Detector.SIZE;

    private readonly session: Promise<ort.InferenceSession>;

    public constructor() {
        const modelPath: string = path.resolve(process.cwd(), "models/yolo26x.onnx");
        this.session = ort.InferenceSession.create(modelPath, { executionProviders: ["dml", "cpu"]});
        console.log("loaded model")
    }

    public async containsPerson(image: Uint8Array): Promise<boolean> {
        const { data: pixels, info } = await sharp(
            Buffer.from(image.buffer, image.byteOffset, image.byteLength)
        )
            .rotate()
            .toColourspace("srgb")
            .modulate({ brightness: 1.2 })
            .resize(Detector.SIZE, Detector.SIZE, {
                fit: "contain",
                background: { r: 114, g: 114, b: 114 }
            })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        if (info.channels !== 3) {
            throw new Error(`Expected 3 image channels, got ${info.channels}`);
        }

        const input = new Float32Array(3 * Detector.AREA);

        for (let p = 0; p < Detector.AREA; p++) {
            const i = p * 3;
            input[p] = pixels[i]! / 255;
            input[Detector.AREA + p] = pixels[i + 1]! / 255;
            input[2 * Detector.AREA + p] = pixels[i + 2]! / 255;
        }

        const session = await this.session;
        const inputName = session.inputNames[0];

        if (!inputName) {
            throw new Error("The ONNX model has no input");
        }

        const results = await session.run({
            [inputName]: new ort.Tensor("float32", input, [1, 3, Detector.SIZE, Detector.SIZE])
        });

        const logitsTensor = results["logits"];

        if (!logitsTensor) {
            throw new Error("The ONNX model has no 'logits' output");
        }

        const dims = logitsTensor.dims;

        if (dims.length !== 3 || dims[0] !== 1 || dims[2] !== 80) {
            throw new Error(`Unexpected logits dimensions: ${dims}`);
        }

        const logits = logitsTensor.data as Float32Array;
        const detections = dims[1]!;
        const classCount = dims[2]!;
        const personClassId = 0;
        const threshold = 0.35;

        let bestConfidence = 0;

        for (let i = 0; i < detections; i++) {
            const logit = logits[i * classCount + personClassId]!;
            const confidence = 1 / (1 + Math.exp(-logit));

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
            }
        }

        console.log("Highest person confidence:", bestConfidence);

        const detected = bestConfidence >= threshold;

        console.log(detected ? "Detected person" : "No person detected");

        return detected;
    }
}