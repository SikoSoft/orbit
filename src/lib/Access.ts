import { AccessPartyType, AccessPolicy } from 'api-spec/models/Access';

export class Access {
  static userHasAccess(
    accessPolicy: AccessPolicy | null,
    userId: string,
  ): boolean {
    if (!accessPolicy || !userId) {
      return false;
    }

    return accessPolicy.parties.some(party => {
      if (party.type === AccessPartyType.USER && party.id === userId) {
        return true;
      }
      if (party.type === AccessPartyType.GROUP) {
        return party.users.some(u => u.id === userId);
      }
      return false;
    });
  }
}
