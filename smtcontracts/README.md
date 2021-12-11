# to create dot net / typscript classes

npx hardhat run scripts/extractAbi.ts
npm run generateV1Types

> colorTrack c# class is msessup in tooling so fix it using git diff

# to deploy to testnet 
> Find the operations account in mongo

db.custodialWallets.find({"usedBy" : "wallet_Deployment"});

set OPERATIONS_ADDRESS=0xXXXXXXXXXXXXXXXXXXXXXXXXXX
set PRIVATE_KEY=0xXXXXXXXXXXXXXXXXXXXXXX

npx hardhat run --network ropsten scripts/deploy.ts