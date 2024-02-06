### Extract Khmer

Extract Khmer text from many images in a folder. 

Create a `.env` file:

```shell
IMAGE_DIRECTORY=data/*.jpg
OUTPUT_DIRECTORY=results
NUM_CONCURRENCY=4
```

Run:

```shell
docker run --rm -it \
  --env-file .env \
  -v "$(pwd)/data:/app/data/" \
  -v "$(pwd)/results/:/app/results" \
  ghcr.io/seanghay/extractkhmer:main
```
