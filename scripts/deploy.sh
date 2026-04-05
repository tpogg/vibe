#!/bin/bash
# DiscordPoker - Devnet Deploy Script
set -e

echo "♠ DiscordPoker Deploy Script"
echo "============================"
echo ""

# Configure for devnet
echo "1. Configuring Solana for devnet..."
solana config set --url devnet

# Check balance and airdrop if needed
BALANCE=$(solana balance --lamports 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
if [ "$BALANCE" -lt "5000000000" ]; then
  echo "2. Requesting devnet airdrop..."
  solana airdrop 2 || echo "   Airdrop failed (rate limited?). Ensure you have devnet SOL."
else
  echo "2. Sufficient balance: $BALANCE lamports"
fi

# Build the program
echo "3. Building Anchor program..."
cargo-build-sbf --manifest-path programs/discord-poker/Cargo.toml

echo "4. Program built successfully!"
echo "   Binary: target/deploy/discord_poker.so"

PROGRAM_ID=$(solana address -k target/deploy/discord_poker-keypair.json)
echo "   Program ID: $PROGRAM_ID"

# Deploy
echo "5. Deploying to devnet..."
solana program deploy target/deploy/discord_poker.so --program-id target/deploy/discord_poker-keypair.json

echo ""
echo "6. Copying IDL to frontend..."
cp target/idl/discord_poker.json app/src/lib/idl.json 2>/dev/null || echo "   Using hand-crafted IDL"

echo ""
echo "=============================="
echo "Deployment complete!"
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Update your .env files:"
echo "  NEXT_PUBLIC_PROGRAM_ID=$PROGRAM_ID"
echo ""
echo "To start the frontend:"
echo "  cd app && npm install && npm run dev"
echo ""
echo "View on Solana Explorer:"
echo "  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "=============================="
