import { PublicKey } from '@solana/web3.js';
import { Command, CommandRunner, InquirerService } from 'nest-commander';
import { log, logErr } from './chalk';
import {
  fetchCandyGuard,
  fetchCandyMachine,
} from '@metaplex-foundation/mpl-core-candy-machine';
import { umi } from '../utils/metaplex';
import { publicKey } from '@metaplex-foundation/umi';
import { PrismaService } from 'nestjs-prisma';

interface Options {
  candyMachineAddress: PublicKey;
}

@Command({
  name: 'fetch-candy-machine',
  description: 'Fetch Core Candy Machine info from the address',
})
export class FetchCandyMachineCommand extends CommandRunner {
  constructor(
    private readonly inquirerService: InquirerService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async run(_: string[], options: Options): Promise<void> {
    options = await this.inquirerService.ask('fetch-candy-machine', options);
    await this.fetchCandyMachine(options);
  }

  async fetchCandyMachine(options: Options) {
    log("🏗️  Starting 'fetch candy machine' command...");

    try {
      const candyMachine = await fetchCandyMachine(
        umi,
        publicKey(options.candyMachineAddress),
        { commitment: 'confirmed' },
      );
      const guard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

      log('✅ Fetched successfully');

      log(guard);
      guard.groups.forEach((group) => {
        log(group.label);
        log(group.guards);
        log('-------------------------------');
      });
      const rarityMap = new Map();
      candyMachine.items.forEach((item) => {
        if (rarityMap.get(item.uri)) {
          const count = rarityMap.get(item.uri) + 1;
          rarityMap.set(item.uri, count);
        } else {
          rarityMap.set(item.uri, 1);
        }
      });
      console.log('RARITY MAP', rarityMap);
      log(candyMachine);
      const itemsMinted = Number(candyMachine.itemsRedeemed);
      const itemsAvailable = Number(candyMachine.data.itemsAvailable);

      const itemsRemaining = itemsAvailable - itemsMinted;
      await this.prisma.candyMachine.update({
        where: { address: candyMachine.publicKey.toString() },
        data: { itemsMinted, itemsAvailable, itemsRemaining },
      });
    } catch (e) {
      logErr(
        `Failed to fetch the candy machine on address ${options.candyMachineAddress.toBase58()}: ${e}`,
      );
    }
  }
}
