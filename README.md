LIMN FRONTEND

less -b -1 --raw /workspace/logs/webui.log 
Pod shell


upload model to jupiternotebook. jupiternotebook terminal:
cd /workspace/models/Stable-diffusion/xl/

then:
wget "https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true" -O sd_xl_turbo_1.0_fp16.safetensors


workflow deforum

Chaos
## Strength
strenght_schedule
0.5—0.9
0.7 is good

Creative
## CFG Scale
cfg_scale_schedule 
5-15
7 is good

## Init Image Strength
strenght
0.9