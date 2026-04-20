import { AccessPartyType, AccessPolicy } from 'api-spec/models/Access';
import { User } from 'api-spec/models/Identity';

export class Access {
  static userHasAccess(
    accessPolicy: AccessPolicy | null,
    user: User | null,
  ): boolean {
    if (!accessPolicy || !user) {
      return false;
    }

    return accessPolicy.parties.some(party => {
      if (party.type === AccessPartyType.USER && party.id === user.id) {
        return true;
      }
      if (party.type === AccessPartyType.GROUP) {
        //
        return party.users.some(u => u.id === user.id);
      }
      return false;
    });
  }
}
