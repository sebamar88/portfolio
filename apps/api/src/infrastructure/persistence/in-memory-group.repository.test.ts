import { groupRepositoryContract } from '../../application/ports/group-repository.contract';
import { InMemoryGroupRepository } from './in-memory-group.repository';

groupRepositoryContract('in-memory', () => new InMemoryGroupRepository());
