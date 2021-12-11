using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Numerics;
using Nethereum.Hex.HexTypes;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Web3;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Contracts.CQS;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.Contracts;
using System.Threading;
using Utilities.NonSignedBids.ContractDefinition;

namespace Utilities.NonSignedBids
{
    public partial class NonSignedBidsService
    {
        public static Task<TransactionReceipt> DeployContractAndWaitForReceiptAsync(Nethereum.Web3.Web3 web3, NonSignedBidsDeployment nonSignedBidsDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            return web3.Eth.GetContractDeploymentHandler<NonSignedBidsDeployment>().SendRequestAndWaitForReceiptAsync(nonSignedBidsDeployment, cancellationTokenSource);
        }

        public static Task<string> DeployContractAsync(Nethereum.Web3.Web3 web3, NonSignedBidsDeployment nonSignedBidsDeployment)
        {
            return web3.Eth.GetContractDeploymentHandler<NonSignedBidsDeployment>().SendRequestAsync(nonSignedBidsDeployment);
        }

        public static async Task<NonSignedBidsService> DeployContractAndGetServiceAsync(Nethereum.Web3.Web3 web3, NonSignedBidsDeployment nonSignedBidsDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            var receipt = await DeployContractAndWaitForReceiptAsync(web3, nonSignedBidsDeployment, cancellationTokenSource);
            return new NonSignedBidsService(web3, receipt.ContractAddress);
        }

        protected Nethereum.Web3.Web3 Web3{ get; }

        public ContractHandler ContractHandler { get; }

        public NonSignedBidsService(Nethereum.Web3.Web3 web3, string contractAddress)
        {
            Web3 = web3;
            ContractHandler = web3.Eth.GetContractHandler(contractAddress);
        }

        public Task<byte[]> ComputeIdQueryAsync(ComputeIdFunction computeIdFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<ComputeIdFunction, byte[]>(computeIdFunction, blockParameter);
        }

        
        public Task<byte[]> ComputeIdQueryAsync(string baseURI, string bidder, BlockParameter blockParameter = null)
        {
            var computeIdFunction = new ComputeIdFunction();
                computeIdFunction.BaseURI = baseURI;
                computeIdFunction.Bidder = bidder;
            
            return ContractHandler.QueryAsync<ComputeIdFunction, byte[]>(computeIdFunction, blockParameter);
        }

        public Task<ContractsOutputDTO> ContractsQueryAsync(ContractsFunction contractsFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<ContractsFunction, ContractsOutputDTO>(contractsFunction, blockParameter);
        }

        public Task<ContractsOutputDTO> ContractsQueryAsync(byte[] returnValue1, BlockParameter blockParameter = null)
        {
            var contractsFunction = new ContractsFunction();
                contractsFunction.ReturnValue1 = returnValue1;
            
            return ContractHandler.QueryDeserializingToObjectAsync<ContractsFunction, ContractsOutputDTO>(contractsFunction, blockParameter);
        }

        public Task<string> CreateBidRequestAsync(CreateBidFunction createBidFunction)
        {
             return ContractHandler.SendRequestAsync(createBidFunction);
        }

        public Task<TransactionReceipt> CreateBidRequestAndWaitForReceiptAsync(CreateBidFunction createBidFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(createBidFunction, cancellationToken);
        }

        public Task<string> CreateBidRequestAsync(string baseURI, BigInteger expiresOn, BigInteger begin, BigInteger end)
        {
            var createBidFunction = new CreateBidFunction();
                createBidFunction.BaseURI = baseURI;
                createBidFunction.ExpiresOn = expiresOn;
                createBidFunction.Begin = begin;
                createBidFunction.End = end;
            
             return ContractHandler.SendRequestAsync(createBidFunction);
        }

        public Task<TransactionReceipt> CreateBidRequestAndWaitForReceiptAsync(string baseURI, BigInteger expiresOn, BigInteger begin, BigInteger end, CancellationTokenSource cancellationToken = null)
        {
            var createBidFunction = new CreateBidFunction();
                createBidFunction.BaseURI = baseURI;
                createBidFunction.ExpiresOn = expiresOn;
                createBidFunction.Begin = begin;
                createBidFunction.End = end;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(createBidFunction, cancellationToken);
        }

        public Task<string> FulfillRequestAsync(FulfillFunction fulfillFunction)
        {
             return ContractHandler.SendRequestAsync(fulfillFunction);
        }

        public Task<TransactionReceipt> FulfillRequestAndWaitForReceiptAsync(FulfillFunction fulfillFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(fulfillFunction, cancellationToken);
        }

        public Task<string> FulfillRequestAsync(byte[] contractId, string cbTrackAddress, BigInteger tokenId)
        {
            var fulfillFunction = new FulfillFunction();
                fulfillFunction.ContractId = contractId;
                fulfillFunction.CbTrackAddress = cbTrackAddress;
                fulfillFunction.TokenId = tokenId;
            
             return ContractHandler.SendRequestAsync(fulfillFunction);
        }

        public Task<TransactionReceipt> FulfillRequestAndWaitForReceiptAsync(byte[] contractId, string cbTrackAddress, BigInteger tokenId, CancellationTokenSource cancellationToken = null)
        {
            var fulfillFunction = new FulfillFunction();
                fulfillFunction.ContractId = contractId;
                fulfillFunction.CbTrackAddress = cbTrackAddress;
                fulfillFunction.TokenId = tokenId;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(fulfillFunction, cancellationToken);
        }

        public Task<GetBidOutputDTO> GetBidQueryAsync(GetBidFunction getBidFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryDeserializingToObjectAsync<GetBidFunction, GetBidOutputDTO>(getBidFunction, blockParameter);
        }

        public Task<GetBidOutputDTO> GetBidQueryAsync(byte[] contractId, BlockParameter blockParameter = null)
        {
            var getBidFunction = new GetBidFunction();
                getBidFunction.ContractId = contractId;
            
            return ContractHandler.QueryDeserializingToObjectAsync<GetBidFunction, GetBidOutputDTO>(getBidFunction, blockParameter);
        }

        public Task<string> OwnerQueryAsync(OwnerFunction ownerFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<OwnerFunction, string>(ownerFunction, blockParameter);
        }

        
        public Task<string> OwnerQueryAsync(BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<OwnerFunction, string>(null, blockParameter);
        }

        public Task<string> RenounceOwnershipRequestAsync(RenounceOwnershipFunction renounceOwnershipFunction)
        {
             return ContractHandler.SendRequestAsync(renounceOwnershipFunction);
        }

        public Task<string> RenounceOwnershipRequestAsync()
        {
             return ContractHandler.SendRequestAsync<RenounceOwnershipFunction>();
        }

        public Task<TransactionReceipt> RenounceOwnershipRequestAndWaitForReceiptAsync(RenounceOwnershipFunction renounceOwnershipFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(renounceOwnershipFunction, cancellationToken);
        }

        public Task<TransactionReceipt> RenounceOwnershipRequestAndWaitForReceiptAsync(CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync<RenounceOwnershipFunction>(null, cancellationToken);
        }

        public Task<string> TransferOwnershipRequestAsync(TransferOwnershipFunction transferOwnershipFunction)
        {
             return ContractHandler.SendRequestAsync(transferOwnershipFunction);
        }

        public Task<TransactionReceipt> TransferOwnershipRequestAndWaitForReceiptAsync(TransferOwnershipFunction transferOwnershipFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(transferOwnershipFunction, cancellationToken);
        }

        public Task<string> TransferOwnershipRequestAsync(string newOwner)
        {
            var transferOwnershipFunction = new TransferOwnershipFunction();
                transferOwnershipFunction.NewOwner = newOwner;
            
             return ContractHandler.SendRequestAsync(transferOwnershipFunction);
        }

        public Task<TransactionReceipt> TransferOwnershipRequestAndWaitForReceiptAsync(string newOwner, CancellationTokenSource cancellationToken = null)
        {
            var transferOwnershipFunction = new TransferOwnershipFunction();
                transferOwnershipFunction.NewOwner = newOwner;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(transferOwnershipFunction, cancellationToken);
        }

        public Task<string> UpdateBidRequestAsync(UpdateBidFunction updateBidFunction)
        {
             return ContractHandler.SendRequestAsync(updateBidFunction);
        }

        public Task<TransactionReceipt> UpdateBidRequestAndWaitForReceiptAsync(UpdateBidFunction updateBidFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(updateBidFunction, cancellationToken);
        }

        public Task<string> UpdateBidRequestAsync(byte[] contractId, BigInteger expiresOn, BigInteger begin, BigInteger end)
        {
            var updateBidFunction = new UpdateBidFunction();
                updateBidFunction.ContractId = contractId;
                updateBidFunction.ExpiresOn = expiresOn;
                updateBidFunction.Begin = begin;
                updateBidFunction.End = end;
            
             return ContractHandler.SendRequestAsync(updateBidFunction);
        }

        public Task<TransactionReceipt> UpdateBidRequestAndWaitForReceiptAsync(byte[] contractId, BigInteger expiresOn, BigInteger begin, BigInteger end, CancellationTokenSource cancellationToken = null)
        {
            var updateBidFunction = new UpdateBidFunction();
                updateBidFunction.ContractId = contractId;
                updateBidFunction.ExpiresOn = expiresOn;
                updateBidFunction.Begin = begin;
                updateBidFunction.End = end;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(updateBidFunction, cancellationToken);
        }

        public Task<string> WithdrawRequestAsync(WithdrawFunction withdrawFunction)
        {
             return ContractHandler.SendRequestAsync(withdrawFunction);
        }

        public Task<TransactionReceipt> WithdrawRequestAndWaitForReceiptAsync(WithdrawFunction withdrawFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(withdrawFunction, cancellationToken);
        }

        public Task<string> WithdrawRequestAsync(byte[] contractId)
        {
            var withdrawFunction = new WithdrawFunction();
                withdrawFunction.ContractId = contractId;
            
             return ContractHandler.SendRequestAsync(withdrawFunction);
        }

        public Task<TransactionReceipt> WithdrawRequestAndWaitForReceiptAsync(byte[] contractId, CancellationTokenSource cancellationToken = null)
        {
            var withdrawFunction = new WithdrawFunction();
                withdrawFunction.ContractId = contractId;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(withdrawFunction, cancellationToken);
        }
    }
}
