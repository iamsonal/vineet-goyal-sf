import { recordIdGenerator } from '../RecordIdGenerator';

describe('RecordIdGenerator', () => {
    it('create a generator without a user id', () => {
        expect(() => recordIdGenerator(undefined)).toThrow('user id must be 15 or 18 chars');
    });

    it('create a generator with an invalid user id', () => {
        expect(() => recordIdGenerator('005000000000')).toThrow('user id must be 15 or 18 chars');
    });

    it('create a generator with a valid user id', () => {
        const userId = '005B0000000GR4OIAW';
        const generator = recordIdGenerator(userId);
        const id = generator.newRecordId('00A');

        expect(id.length).toBe(18);
        expect(userId.substring(10, 15)).toBe(id.substring(3, 8));
    });

    it('reinitialize the generator with a different user id', () => {
        const userId = '005B0000000GR4OIAW';
        let generator = recordIdGenerator(userId);
        const id1 = generator.newRecordId('00A');

        expect(id1.length).toBe(18);
        expect(userId.substring(10, 15)).toBe(id1.substring(3, 8));

        generator = recordIdGenerator('005B000000XXXXXIAW');
        const id2 = generator.newRecordId('00A');

        expect(id2.length).toBe(18);
        expect(userId.substring(10, 15)).not.toBe(id2.substring(3, 8));
    });

    it('generate a record id with an empty prefix', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(() => generator.newRecordId(undefined)).toThrow('apiName is undefined or empty');
    });

    it('generate a record id with an empty string', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(() => generator.newRecordId('')).toThrow('apiName is undefined or empty');
    });

    it('generate a record id prefixed with 0s if too short', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        const id = generator.newRecordId('0A');
        expect(generator.isGenerated(id)).toBe(true);
        expect(id.substring(0, 3)).toBe('00A');
    });

    it('generate a record id prefixed with 0s if string is 1 character long', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        const id = generator.newRecordId('A');
        expect(generator.isGenerated(id)).toBe(true);
        expect(id.substring(0, 3)).toBe('00A');
    });

    it('ensure successively generated record ids are different', () => {
        const userId = '005B0000000GR4OIAW';
        const generator = recordIdGenerator(userId);
        const id1 = generator.newRecordId('00A');
        const id2 = generator.newRecordId('00A');

        expect(id1).not.toBe(id2);
    });

    it('test a non generated id as not being generated', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(generator.isGenerated(undefined)).toBe(false);
    });

    it('test an incomplete id as being generated', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(generator.isGenerated('005B000GR40IAW')).toBe(false);
    });

    it('test a generated id', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        const id = generator.newRecordId('00A');
        expect(generator.isGenerated(id)).toBe(true);
    });

    it('test a non generated id', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(generator.isGenerated('005B0000000GR4OIAW')).toBe(false);
    });

    it('test record generation time on empty id', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(() => generator.recordGenerationTime(undefined)).toThrow(
            'record id must be 15 or 18 chars'
        );
    });

    it('test record generation time time on non generated id', () => {
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        expect(() => generator.recordGenerationTime('005B0000000GR4OIAW')).toThrow(
            'record id not generated'
        );
    });

    it('test record generation time on generated id', () => {
        const startTime = new Date().getTime();
        const generator = recordIdGenerator('005B0000000GR4OIAW');
        const id = generator.newRecordId('00A');
        const endTime = new Date().getTime();
        const timestamp = generator.recordGenerationTime(id);
        expect(timestamp).toBeGreaterThanOrEqual(startTime);
        expect(timestamp).toBeLessThanOrEqual(endTime);
    });
});
