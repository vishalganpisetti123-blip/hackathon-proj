"""Quantize an exported Whisper specialist for on-device browser inference."""
import argparse
from pathlib import Path
from onnxruntime.quantization import QuantType, quantize_dynamic

parser = argparse.ArgumentParser()
parser.add_argument('--directory', default=str(Path(__file__).resolve().parent / 'export/whisper-telugu-small'))
args = parser.parse_args()
ROOT = Path(args.directory)
OUT = ROOT / 'onnx'
OUT.mkdir(exist_ok=True)
for name in ('encoder_model', 'decoder_model_merged'):
    source = ROOT / f'{name}.onnx'
    target = OUT / f'{name}_quantized.onnx'
    print(f'Quantizing {source} → {target}', flush=True)
    quantize_dynamic(
        str(source), str(target), weight_type=QuantType.QUInt8,
        op_types_to_quantize=['MatMul'], extra_options={'EnableSubgraph': True},
    )
    print(f'Wrote {target.stat().st_size:,} bytes', flush=True)
