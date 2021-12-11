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
using Utilities.CbFactory.ContractDefinition;

namespace Utilities.CbFactory
{
    public partial class CbFactoryService
    {
        public static Task<TransactionReceipt> DeployContractAndWaitForReceiptAsync(Nethereum.Web3.Web3 web3, CbFactoryDeployment cbFactoryDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            return web3.Eth.GetContractDeploymentHandler<CbFactoryDeployment>().SendRequestAndWaitForReceiptAsync(cbFactoryDeployment, cancellationTokenSource);
        }

        public static Task<string> DeployContractAsync(Nethereum.Web3.Web3 web3, CbFactoryDeployment cbFactoryDeployment)
        {
            return web3.Eth.GetContractDeploymentHandler<CbFactoryDeployment>().SendRequestAsync(cbFactoryDeployment);
        }

        public static async Task<CbFactoryService> DeployContractAndGetServiceAsync(Nethereum.Web3.Web3 web3, CbFactoryDeployment cbFactoryDeployment, CancellationTokenSource cancellationTokenSource = null)
        {
            var receipt = await DeployContractAndWaitForReceiptAsync(web3, cbFactoryDeployment, cancellationTokenSource);
            return new CbFactoryService(web3, receipt.ContractAddress);
        }

        protected Nethereum.Web3.Web3 Web3{ get; }

        public ContractHandler ContractHandler { get; }

        public CbFactoryService(Nethereum.Web3.Web3 web3, string contractAddress)
        {
            Web3 = web3;
            ContractHandler = web3.Eth.GetContractHandler(contractAddress);
        }

        public Task<string> CreateTrackRequestAsync(CreateTrackFunction createTrackFunction)
        {
             return ContractHandler.SendRequestAsync(createTrackFunction);
        }

        public Task<TransactionReceipt> CreateTrackRequestAndWaitForReceiptAsync(CreateTrackFunction createTrackFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(createTrackFunction, cancellationToken);
        }

        public Task<string> CreateTrackRequestAsync(string minter, BigInteger count, BigInteger forSaleBegin, BigInteger forSaleEnd, string baseUri)
        {
            var createTrackFunction = new CreateTrackFunction();
                createTrackFunction.Minter = minter;
                createTrackFunction.Count = count;
                createTrackFunction.ForSaleBegin = forSaleBegin;
                createTrackFunction.ForSaleEnd = forSaleEnd;
                createTrackFunction.BaseUri = baseUri;
            
             return ContractHandler.SendRequestAsync(createTrackFunction);
        }

        public Task<TransactionReceipt> CreateTrackRequestAndWaitForReceiptAsync(string minter, BigInteger count, BigInteger forSaleBegin, BigInteger forSaleEnd, string baseUri, CancellationTokenSource cancellationToken = null)
        {
            var createTrackFunction = new CreateTrackFunction();
                createTrackFunction.Minter = minter;
                createTrackFunction.Count = count;
                createTrackFunction.ForSaleBegin = forSaleBegin;
                createTrackFunction.ForSaleEnd = forSaleEnd;
                createTrackFunction.BaseUri = baseUri;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(createTrackFunction, cancellationToken);
        }

        public Task<BigInteger> FeesQueryAsync(FeesFunction feesFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<FeesFunction, BigInteger>(feesFunction, blockParameter);
        }

        
        public Task<BigInteger> FeesQueryAsync(BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<FeesFunction, BigInteger>(null, blockParameter);
        }

        public Task<string> GetCbTrackAddressQueryAsync(GetCbTrackAddressFunction getCbTrackAddressFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<GetCbTrackAddressFunction, string>(getCbTrackAddressFunction, blockParameter);
        }

        
        public Task<string> GetCbTrackAddressQueryAsync(string baseUri, BlockParameter blockParameter = null)
        {
            var getCbTrackAddressFunction = new GetCbTrackAddressFunction();
                getCbTrackAddressFunction.BaseUri = baseUri;
            
            return ContractHandler.QueryAsync<GetCbTrackAddressFunction, string>(getCbTrackAddressFunction, blockParameter);
        }

        public Task<string> MasterQueryAsync(MasterFunction masterFunction, BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<MasterFunction, string>(masterFunction, blockParameter);
        }

        
        public Task<string> MasterQueryAsync(BlockParameter blockParameter = null)
        {
            return ContractHandler.QueryAsync<MasterFunction, string>(null, blockParameter);
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

        public Task<string> UpdateFeesRequestAsync(UpdateFeesFunction updateFeesFunction)
        {
             return ContractHandler.SendRequestAsync(updateFeesFunction);
        }

        public Task<TransactionReceipt> UpdateFeesRequestAndWaitForReceiptAsync(UpdateFeesFunction updateFeesFunction, CancellationTokenSource cancellationToken = null)
        {
             return ContractHandler.SendRequestAndWaitForReceiptAsync(updateFeesFunction, cancellationToken);
        }

        public Task<string> UpdateFeesRequestAsync(BigInteger fees)
        {
            var updateFeesFunction = new UpdateFeesFunction();
                updateFeesFunction.Fees = fees;
            
             return ContractHandler.SendRequestAsync(updateFeesFunction);
        }

        public Task<TransactionReceipt> UpdateFeesRequestAndWaitForReceiptAsync(BigInteger fees, CancellationTokenSource cancellationToken = null)
        {
            var updateFeesFunction = new UpdateFeesFunction();
                updateFeesFunction.Fees = fees;
            
             return ContractHandler.SendRequestAndWaitForReceiptAsync(updateFeesFunction, cancellationToken);
        }
    }
}
