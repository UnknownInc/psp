gcloud kms encrypt \
  --plaintext-file=secrets.json \
  --ciphertext-file=secrets.json.enc \
  --location=global \
  --keyring=pspkeyring \
  --key=uisecrets

gcloud kms encrypt --plaintext-file=id_rsa \
 --ciphertext-file=id_rsa.enc \
 --location=global --keyring=pspkeyring --key=github-key