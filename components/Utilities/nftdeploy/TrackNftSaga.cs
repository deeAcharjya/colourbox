using Automatonymous;
using MassTransit;
using MassTransit.Saga;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Utilities.nftdeploy
{
    public class TrackNftState :    SagaStateMachineInstance, ISagaVersion
    {
        public Guid CorrelationId { get; set; }
        public State CurrentState { get; set; }
        public int Version { get; set; }

        public Guid? ProcessingId { get; set; }
    }


    


    public class TrackNftStateMachine : MassTransitStateMachine<TrackNftState>
    {

        public TrackNftStateMachine()
        {
            Request(() => CreateNFT, order => order.ProcessingId, config => { config.Timeout = TimeSpan.FromMinutes(30); });

            Initially(
                When(SubmitOrder)
                    .Request(CreateNFT, context => new CreateNFT { order = context.Data})
                    .TransitionTo(CreateNFT.Pending));


            During(CreateNFT.Pending,

                When(CreateNFT.Completed)
                    .TransitionTo(Created),

                When(CreateNFT.Faulted)
                    .TransitionTo(Cancelled),

                When(CreateNFT.TimeoutExpired)
                    .TransitionTo(Cancelled)

                );

        }

        public State Created { get; private set; }
        public State Cancelled { get; private set; }

        public Event<ColorTrackDeployModel> SubmitOrder { get; private set; }

        public Request<TrackNftState, CreateNFT, NFTCreated> CreateNFT { get; set; }
    }
}
