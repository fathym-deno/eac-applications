import {
  EaCCommitRequest,
  EaCCommitResponse,
  EaCDeleteRequest,
  eacExists,
  EaCRuntimeHandlers,
  EaCStatus,
  EaCStatusProcessingTypes,
  enqueueAtomic,
  EverythingAsCode,
  STATUS_CODE,
} from '../../.deps.ts';
import { EaCStewardAPIState } from '../../state/EaCStewardAPIState.ts';

export default {
  async GET(req, ctx) {
    const entLookup = ctx.State.EnterpriseLookup!;

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'eac');

    const eac = await eacKv.get<EverythingAsCode>([
      'EaC',
      'Current',
      entLookup,
    ]);

    return Response.json(eac.value);
  },

  async POST(req, ctx) {
    const logger = ctx.Runtime.Logs;

    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

    const username = ctx.State.Username;

    const url = new URL(req.url);

    const skipActuators = url.searchParams.has('skipActuators');

    const processingSeconds = Number.parseInt(
      url.searchParams.get('processingSeconds')!,
    );

    const eac = (await req.json()) as EverythingAsCode;

    const actJWT = (eac.ActuatorJWT as string) || '';
    delete eac.ActuatorJWT;

    const commitStatus: EaCStatus = {
      ID: crypto.randomUUID(),
      EnterpriseLookup: entLookup,
      Messages: { Queued: 'Commiting existing EaC container' },
      Processing: EaCStatusProcessingTypes.QUEUED,
      StartTime: new Date(Date.now()),
      Username: username!,
    };

    logger.Package.debug(
      `Updating EaC container for ${eac.EnterpriseLookup} with Commit ID ${commitStatus.ID}.`,
    );

    const commitReq: EaCCommitRequest = {
      CommitID: commitStatus.ID,
      EaC: {
        ...(eac || {}),
        EnterpriseLookup: commitStatus.EnterpriseLookup,
      },
      JWT: actJWT || ctx.State.JWT!,
      ProcessingSeconds: processingSeconds,
      SkipActuators: skipActuators,
      Username: '',
    };

    if (!commitReq.EaC.EnterpriseLookup) {
      return Response.json(
        {
          Message: 'The enterprise lookup must be provided.',
        },
        {
          status: STATUS_CODE.BadRequest,
        },
      );
    }

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'eac');

    if (!(await eacExists(eacKv, commitReq.EaC.EnterpriseLookup))) {
      return Response.json(
        {
          Message: 'The enterprise must first be created before it can be updated.',
        },
        {
          status: STATUS_CODE.BadRequest,
        },
      );
    }

    const commitKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'commit');

    await enqueueAtomic(
      commitKv,
      commitReq,
      (op) => {
        return op
          .set(
            [
              'EaC',
              'Status',
              commitStatus.EnterpriseLookup,
              'ID',
              commitStatus.ID,
            ],
            commitStatus,
          )
          .set(
            ['EaC', 'Status', commitStatus.EnterpriseLookup, 'EaC'],
            commitStatus,
          );
      },
      eacKv,
    );

    logger.Package.debug(
      `EaC container update for ${eac.EnterpriseLookup} queued with Commit ID ${commitStatus.ID}.`,
    );

    return Response.json({
      CommitID: commitStatus.ID,
      EnterpriseLookup: commitStatus.EnterpriseLookup,
      Message: `The enterprise '${commitReq.EaC.EnterpriseLookup}' commit has been queued.`,
    } as EaCCommitResponse);
  },

  async DELETE(req, ctx) {
    const entLookup = ctx.State.UserEaC!.EnterpriseLookup;

    const username = ctx.State.Username!;

    const eac = (await req.json()) as EverythingAsCode;
    const actJWT = (eac.ActuatorJWT as string) || '';
    delete eac.ActuatorJWT;

    const url = new URL(req.url);

    const processingSeconds = Number.parseInt(
      url.searchParams.get('processingSeconds')!,
    );

    const commitStatus: EaCStatus = {
      ID: crypto.randomUUID(),
      EnterpriseLookup: entLookup!,
      Messages: { Queued: 'Deleting existing EaC container' },
      Processing: EaCStatusProcessingTypes.QUEUED,
      StartTime: new Date(Date.now()),
      Username: username!,
    };

    const deleteReq: EaCDeleteRequest = {
      Archive: JSON.parse(
        url.searchParams.get('archive') || 'false',
      ) as boolean,
      CommitID: commitStatus.ID,
      EaC: {
        ...eac,
        EnterpriseLookup: entLookup,
      },
      JWT: actJWT || ctx.State.JWT!,
      ProcessingSeconds: processingSeconds,
      Username: username,
    };

    if (!deleteReq.EaC.EnterpriseLookup) {
      return Response.json(
        {
          Message: 'The enterprise lookup must be provided.',
        },
        {
          status: STATUS_CODE.BadRequest,
        },
      );
    }

    const eacKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'eac');

    if (!(await eacExists(eacKv, deleteReq.EaC.EnterpriseLookup))) {
      return Response.json(
        {
          Message: `The enterprise must first be created before it can ${
            deleteReq.Archive ? ' be archived' : 'execute delete operations'
          }.`,
        },
        {
          status: STATUS_CODE.BadRequest,
        },
      );
    }

    const commitKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(Deno.Kv, 'commit');

    await enqueueAtomic(
      commitKv,
      deleteReq,
      (op) => {
        return op
          .set(
            [
              'EaC',
              'Status',
              commitStatus.EnterpriseLookup,
              'ID',
              commitStatus.ID,
            ],
            commitStatus,
          )
          .set(
            ['EaC', 'Status', commitStatus.EnterpriseLookup, 'EaC'],
            commitStatus,
          );
      },
      eacKv,
    );

    return Response.json({
      CommitID: commitStatus.ID,
      EnterpriseLookup: commitStatus.EnterpriseLookup,
      Message: `The enterprise '${deleteReq.EaC.EnterpriseLookup}' ${
        deleteReq.Archive ? 'archiving' : 'delete operations'
      } have been queued.`,
    } as EaCCommitResponse);
  },
} as EaCRuntimeHandlers<EaCStewardAPIState>;
