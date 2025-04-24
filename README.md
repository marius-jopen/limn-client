LIMN FRONTEND

less -b -1 --raw /workspace/logs/webui.log 
Pod shell

terminal:
ssh ikj45g6hubikuh-64411745@ssh.runpod.io -i ~/.ssh/id_ed25519

upload model to jupiternotebook. jupiternotebook terminal:
cd /workspace/models/Stable-diffusion/xl/


mariusjopen@Mariuss-MBP ~ % ssh ikj45g6hubikuh-64411745@ssh.runpod.io -i ~/.ssh/id_ed25519


then:
wget "https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors?download=true" -O sd_xl_turbo_1.0_fp16.safetensors



wget "https://www.dropbox.com/scl/fi/j2yt9yworeifi9g1tt34v/ae.safetensors?rlkey=apqk3dt094uhisrjz03sf1mx4&st=zjnbciop&dl=1" -O ae.safetensors

or with curl
curl -L "https://www.dropbox.com/scl/fi/n45txsn6kzxapm5l06i71/flux_1Dev.safetensors?rlkey=m7gs0knoxxothdlog9jqdqd9l&st=wniokh13&dl=1" -o flux_1Dev.safetensors

resume curl
curl -C - -L "https://www.dropbox.com/scl/fi/n45txsn6kzxapm5l06i71/flux_1Dev.safetensors?rlkey=m7gs0knoxxothdlog9jqdqd9l&st=wniokh13&dl=1" -o flux_1Dev.safetensors

with aria super fast:
aria2c -x 16 -s 16 "https://www.dropbox.com/scl/fi/n45txsn6kzxapm5l06i71/flux_1Dev.safetensors?rlkey=m7gs0knoxxothdlog9jqdqd9l&st=wniokh13&dl=1" -o flux_1Dev.safetensors

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