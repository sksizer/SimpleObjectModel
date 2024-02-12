import { beforeEach, describe, expect, test } from 'vitest';
import { Context, getContext } from '@/index';

import oneToOneRelationship from './fixtures/relationshipsSingleScope.json';
import customKeysForLinking from './fixtures/customKeysForLinking.json';
import extendedLinking from './fixtures/extendedLinking.json';
import brokenDataFieldContract from './fixtures/brokenDataFieldContract.json';
import { toCamelCase } from '@/impl/utility';

describe('Basic Instantiation', () => {
  describe('Data Shape Conventions', () => {
    describe('Non tabular data', () => {
      test('Can load non-tabular data and we skip over making a table for it', () => {
        const testData = {
          type1: {
            name: 'I am type1',
            description: 'I do not have data',
          },
        };
        // type DBType = typeof testData;
        let db = getContext();
        expect(() => {
          db.loadFromObject(testData);
        }).not.toThrowError();
      });
    });

    describe('Field "data" is expected to be an array', () => {
      let db = getContext();
      test('Throws specific error if data field is present but is not an array', () => {
        expect(() => {
          db.loadFromObject(brokenDataFieldContract as any);
        }).toThrow();
      });
    });
    // TODO - consider allowing key/value pairs on the data field at some point.
  });

  describe('Object Linking', () => {
    describe('System Sanity Checks', () => {
      test('Data cannot have a related field', () => {
        let db = getContext();
        expect(() => {
          db.loadFromObject({
            type1: {
              data: [
                {
                  _k: 1,
                  n: 'type1',
                  related: 1,
                },
              ],
            },
          });
        }).toThrowError();
      });
    });

    test('Linking to non-existent object key throws an error', () => {
      let db = getContext();
      expect(() => {
        db.loadFromObject({
          type1: {
            data: [
              {
                _k: 1,
                n: 'type1',
                _relatedType1: 1,
              },
            ],
          },
        });
      }).toThrowError();
    });

    describe('Simple links by field name conventions.', () => {
      type LinkTarget = (typeof oneToOneRelationship.linkTarget.data)[0] & {
        related: { linker: Linker[] };
      };
      type Linker = (typeof oneToOneRelationship.linker.data)[0] & {
        linkTarget: LinkTarget;
        related: {
          linkersTracker: LinkersTracker[];
        };
      };
      type LinkersTracker =
        (typeof oneToOneRelationship.linkersTracker.data)[0] & {
          linkers: Linker[];
        };

      let db: Context;
      let linker: Linker;
      let linkTarget: LinkTarget;
      beforeEach(async () => {
        db = getContext();
        db.loadFromObject(oneToOneRelationship);
        linkTarget = db.getTypeStore('linkTarget')?.get(1) as LinkTarget;
        linker = db.getTypeStore('linker')?.get(1) as Linker;
      });

      test('Fixture Check', () => {
        expect(db.getTypes().length).to.equal(3);
        expect(db.getTypeStore('linkTarget')?.count()).to.equal(1);
        expect(db.getTypeStore('linker')?.count()).to.equal(3);
      });

      test("Objects are linked to single target:  '_target: key'", () => {
        expect(linker?.linkTarget).toStrictEqual(linkTarget);
        expect(linkTarget?.related).toBeDefined();
        expect(linkTarget?.related.linker).toBeDefined();
        expect(linkTarget?.related.linker.length).to.equal(3);
        expect(linkTarget?.related.linker[0]._k).toStrictEqual(1);
        expect(linkTarget?.related.linker[1]._k).toStrictEqual(2);
        expect(linkTarget?.related.linker[2]._k).toStrictEqual(3);
      });

      test('Objects are linked to multiple targets: _target_s: [key, key]', () => {
        let linkersTracker: any = db.getTypeStore('linkersTracker')?.get(1);
        let linkers = linkersTracker.linkers;
        expect(linkers).toBeDefined();
        expect(linkers.length).to.equal(3);
        for (let i: number = 1; i <= 3; i++) {
          let linker: any = db.getTypeStore('linker')?.get(i);
          expect(linker.related).toBeDefined();
          expect(linker.related.linkersTracker).toBeDefined();
          expect(linker.related.linkersTracker.length).toEqual(1);
          expect(linker.related.linkersTracker[0]).toStrictEqual(
            linkersTracker,
          );
        }
      });
    });

    describe('Linking source to same target multiple times: _first_target: key, _second_target: key', () => {
      test('Fixture check', () => {
        let db = getContext();
        db.loadFromObject(extendedLinking);
        let dayTable = db.getTypeStore('day');
        let tripTable = db.getTypeStore('trip');
        expect(dayTable?.count()).to.equal(2);
        expect(tripTable?.count()).to.equal(1);
        let startDay: { related: { trip: any }; _k: string | number } = dayTable
          .query()
          .find((d: any) => d._k === '2024-01-01') as any;
        expect(startDay).toBeDefined();
        expect(startDay._k).toEqual('2024-01-01');
        let endDay: { _k: any; related: { trip: any } } = dayTable
          .query()
          .find((d: any) => d._k === '2024-01-30') as any;
        expect(endDay._k).toEqual('2024-01-30');
        expect(endDay).toBeDefined();
        let trip: { startDay: { related: { trip: any } }; endDay: any } =
          tripTable?.get(1) as any;
        expect(trip).toBeDefined();
        expect(trip.startDay).toBeDefined();
        expect(trip.startDay).toStrictEqual(startDay);
        expect(trip.endDay).toBeDefined();
        expect(trip.endDay).toStrictEqual(endDay);
        expect(startDay.related).toBeDefined();
        expect(startDay.related.trip).toBeDefined();
        expect(startDay.related.trip.length).toEqual(1);
        expect(startDay.related.trip[0]).toStrictEqual(trip);
        expect(endDay.related).toBeDefined();
        expect(endDay.related.trip).toBeDefined();
        expect(endDay.related.trip.length).toEqual(1);
        expect(endDay.related.trip[0]).toStrictEqual(trip);
      });
    });

    describe.skip('Customizing Type Data', () => {
      test('Fixture Check', () => {
        let db = getContext();
        db.loadFromObject(customKeysForLinking);
        let typeA = db.getTypeStore('typeA');
        let typeB = db.getTypeStore('typeB');
        let typeC = db.getTypeStore('typeC');
        expect(typeA.count()).to.equal(2);
        expect(typeB.count()).to.equal(1);
        expect(typeC.count()).to.equal(1);
      });
      test('Can specify a custom key field via metadata', () => {
        // let typeA = db.getTypeStore('typeA');
        // let typeB = db.getTypeStore('typeB');
        // let typeC   = db.getTypeStore('typeC');
        // let a1 = typeA.get(1);
        // let a2 = typeA.get(2);
        // let b1 = typeB.get(1);
        // let c1 = typeC.get(1);
      });
    });
  });

  describe('Nested Data', () => {
    test('Nested data that fulfills table conventions is registered as a table', () => {
      const testData = {
        type1: {
          type2: {
            data: [
              {
                _k: 1,
                n: 'type2data1',
              },
            ],
          },
        },
      };
      let db = getContext();
      db.loadFromObject(testData);
      expect(db.getTypes().length).to.equal(1);
    });

    test.skip('Nested table data in data is also registered as a table', () => {
      let db = getContext();
      db.loadFromObject({
        type1: {
          data: [
            {
              _k: 1,
              n: 'type1',
              type2: {
                data: [
                  {
                    _k: 1,
                    n: 'type2',
                  },
                ],
              },
            },
          ],
        },
      });
      expect(db.getTypes().length).to.equal(2);
      expect(db.getTypeStore('type1')).toBeDefined();
      expect(db.getTypeStore('type2')).toBeDefined();
    });
  });

  describe('Function Tests', () => {
    test('toCamelCase', () => {
      expect(toCamelCase('hello')).toStrictEqual('hello');
      expect(toCamelCase('hello_world', 'something')).toStrictEqual(
        'helloWorldSomething',
      );
      expect(toCamelCase('hello_world')).toStrictEqual('helloWorld');
      expect(toCamelCase('hello_world', 'example-string')).toStrictEqual(
        'helloWorldExampleString',
      );
      expect(toCamelCase(['hello', 'world'], 'example-string')).toStrictEqual(
        'helloWorldExampleString',
      );
    });
  });
});

//
// describe('SDB', () => {
//     let db: SDB;
//     beforeEach(async () => {
//         db = getContext()
//     })
//
//     describe('Table', () => {
//         describe('Registration', () => {
//             test('Register type returns the table', () => {
//                 type DataSetType = {
//
//                 }
//                 let t = db.getTypeStore('dataSetTypes')
//                 expect(t).not.toBeNull();
//                 let l = t.query()[0];
//                 expect(db.getTypeStore('dataSetTypes')).not.toBeNull();
//                 expect(db.getTypeStore<DataSetType>('dataSetTypes')).not.toBeNull();
//             })
//         })
//
//         describe('Table Retrieval', () => {
//             test('getTable throws error if table does not exist', () => {
//                 expect(() => {
//                     db.getTypeStore('dataSetTypes')
//                 }).toThrowError();
//             })
//
//             test('getTable returns table if table exists', () => {
//                 expect(db.getTypeStore('dataSetTypes')).not.toBeNull();
//             })
//         });
//
//         describe('Query', () => {
//             describe('Against SingleType Fixture', () => {
//                 test('Test params _k', () => {
//                     type SingleType = {}
//                     db.fillFromObject(fixtureSingleType);
//                     let table = db.getTypeStore('singleType');
//
//                     expect(table?.query().length).to.equal(4);
//                     expect(table?.query({"_k": 1}).length).to.equal(1)
//                     expect(table?.query({"_k": 2}).length).to.equal(1)
//                     expect(table?.query({"_k": 3}).length).to.equal(1)
//                     expect(table?.query({"_k": 4}).length).to.equal(1)
//
//                     let results = table.query({"n": "something else"})
//                     expect(results.length).to.equal(3);
//                     results = table.query({"n": "something"})
//                     expect(results.length).to.equal(1);
//                 })
//             })
//         })
//
//         describe('Sample Data', () => {
//             describe('Single Type Tests', () => {
//                 type SingleType = {
//                     data: any[]
//                 }
//                 beforeEach(async () => {
//                     db.fillFromObject(fixtureSingleType);
//                 })
//
//                 test('Fixture Sanity Check', () => {
//                     let table = db.getTypeStore<SingleType>('singleType');
//                     expect(table).not.toBeNull();
//                     expect(table?.count()).to.equal(4);
//                     expect(db.getTypes()).toStrictEqual(['singleType']);
//                 })
//
//                 test('get Data by key', () => {
//                     let table = db.getTypeStore<SingleType>('singleType');
//                     expect(table?.get(1)).not.toBeNull();
//                     expect(table?.get(2)).not.toBeNull();
//                     expect(table?.get(3)).not.toBeNull();
//                     expect(table?.get(4)).not.toBeNull();
//                 })
//             })
//         })
//
//         describe('Simple Relationship Test', () => {
//             type DataSetType = {}
//             type DataSet = {}
//             type Configuration = {}
//
//             type TypeA = {
//                 typeB: TypeB
//             }
//             type TypeB = {
//                 typeA: TypeA
//             }
//             beforeEach(async () => {
//                 db.fillFromObject(fixtureSimpleRelationship)
//             });
//
//             test('Fixture Sanity Check', () => {
//                 let tTypeA = db.getTypeStore<TypeA>('typeA');
//                 let tTypeB = db.getTypeStore<TypeB>('typeB');
//                 expect(tTypeA).not.toBeNull();
//                 expect(tTypeB).not.toBeNull();
//                 expect(db.getTypeStore<TypeA>('typeA')).not.toBeNull();
//                 expect(db.getTypeStore<TypeB>('typeB')).not.toBeNull();
//                 expect(tTypeA?.count()).to.equal(1);
//                 expect(tTypeB?.count()).to.equal(1);
//             })
//
//             test('Relationship', () => {
//                 let tTypeA = db.getTypeStore<TypeA>('typeA');
//                 let tTypeB = db.getTypeStore<TypeB>('typeB');
//                 let typeA = tTypeA?.get(1);
//                 let typeB = tTypeB?.get(1);
//                 expect(typeA).not.toBeNull();
//                 expect(typeB).not.toBeNull();
//                 expect(typeA?.typeB).toStrictEqual(typeB);
//                 expect(typeB?.typeA).toStrictEqual(typeA);
//             })
//         })
//
//         test('Registering Types', () => {
//
//
//             expect(db.getTypeStore('dataSetTypes')).not.toBeNull();
//             expect(db.getTypeStore('dataSets')).not.toBeNull();
//             expect(db.getTypeStore('configurations')).not.toBeNull();
//
//             expect(db.getTypeStore<DataSetType>('dataSetTypes')).not.toBeNull();
//             expect(db.getTypeStore<DataSet>('dataSets')).not.toBeNull();
//             expect(db.getTypeStore<Configuration>('configurations')).not.toBeNull();
//         });
//
//         test('Double registering throws an error', () => {
//         })
//
//         test('Can instantiate from object', () => {
//             db.fillFromObject(fixtureTest);
//             let dataSetTypes = db.getTypeStore('dataSetTypes');
//             let dataSets = db.getTypeStore('dataSets');
//             let configurations = db.getTypeStore('configurations');
//             expect(dataSetTypes.count()).toBe(1);
//             expect(dataSets.count()).toBe(2);
//             expect(configurations.count()).toBe(1);
//         })
//     });
//
//     describe('Functions', () => {
//         test('getValidRelationshipFields', () => {
//             let testObject = {
//                 "_k": 1,
//                 "n": "dataSetTypes",
//                 "somethingElse": "somethingElse",
//                 "_relatedType1": 1,
//                 "_relatedType2": 2
//             }
//
//             let validFields = getValidRelationshipFields(testObject);
//             expect(validFields.length).to.equal(2);
//             expect(validFields[0]._fieldName).to.equal('_relatedType1');
//             expect(validFields[0].propName).to.equal('relatedType1');
//             expect(validFields[0].value).to.equal(1);
//
//             expect(validFields[1]._fieldName).to.equal('_relatedType2');
//             expect(validFields[1].propName).to.equal('relatedType2');
//             expect(validFields[1].value).to.equal(2);
//         });
//     });
// })
//
