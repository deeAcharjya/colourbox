/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { ContractOptions } from "web3-eth-contract";
import { EventLog } from "web3-core";
import { EventEmitter } from "events";
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "./types";

export interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type NewBid = ContractEventLog<{
  contractId: string;
  bidder: string;
  baseURI: string;
  0: string;
  1: string;
  2: string;
}>;
export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string;
  newOwner: string;
  0: string;
  1: string;
}>;

export interface NonSignedBids extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): NonSignedBids;
  clone(): NonSignedBids;
  methods: {
    computeId(
      _baseURI: string,
      bidder: string
    ): NonPayableTransactionObject<string>;

    contracts(arg0: string | number[]): NonPayableTransactionObject<{
      baseURI: string;
      bidPrice: string;
      bidder: string;
      expiresOn: string;
      created: string;
      slice: [string, string, string];
      0: string;
      1: string;
      2: string;
      3: string;
      4: string;
      5: [string, string, string];
    }>;

    createBid(
      _baseURI: string,
      _expiresOn: number | string | BN,
      _begin: number | string | BN,
      _end: number | string | BN
    ): PayableTransactionObject<void>;

    factory(): NonPayableTransactionObject<string>;

    fulfill(
      _contractId: string | number[],
      _cbTrackAddress: string,
      _tokenId: number | string | BN
    ): NonPayableTransactionObject<void>;

    getBid(_contractId: string | number[]): NonPayableTransactionObject<{
      baseURI: string;
      bidPrice: string;
      bidder: string;
      expiresOn: string;
      created: string;
      begin: string;
      end: string;
      0: string;
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
    }>;

    owner(): NonPayableTransactionObject<string>;

    renounceOwnership(): NonPayableTransactionObject<void>;

    setfactory(_factory: string): NonPayableTransactionObject<void>;

    transferOwnership(newOwner: string): NonPayableTransactionObject<void>;

    updateBid(
      _contractId: string | number[],
      _expiresOn: number | string | BN,
      _begin: number | string | BN,
      _end: number | string | BN
    ): PayableTransactionObject<void>;

    withdraw(_contractId: string | number[]): NonPayableTransactionObject<void>;
  };
  events: {
    NewBid(cb?: Callback<NewBid>): EventEmitter;
    NewBid(options?: EventOptions, cb?: Callback<NewBid>): EventEmitter;

    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter;
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "NewBid", cb: Callback<NewBid>): void;
  once(event: "NewBid", options: EventOptions, cb: Callback<NewBid>): void;

  once(event: "OwnershipTransferred", cb: Callback<OwnershipTransferred>): void;
  once(
    event: "OwnershipTransferred",
    options: EventOptions,
    cb: Callback<OwnershipTransferred>
  ): void;
}
