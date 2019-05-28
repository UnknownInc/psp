gcloud kms encrypt \
  --plaintext-file=secrets.json \
  --ciphertext-file=secrets.json.enc \
  --location=global \
  --keyring=pspkeyring \
  --key=uisecrets

# gcloud kms encrypt --plaintext-file=id_rsa \
#  --ciphertext-file=id_rsa.enc \
#  --location=global --keyring=pspkeyring --key=github-key

#  gcloud kms keys create githubkey \
#   --location=global \
#   --keyring=pspkeyring \
#   --purpose=encryption

gcloud kms keys add-iam-policy-binding \
    githubkey --location=global --keyring=pspkeyring \
    --member=serviceAccount:[SERVICE-ACCOUNT]@cloudbuild.gserviceaccount.com \
    --role=roles/cloudkms.cryptoKeyDecrypter