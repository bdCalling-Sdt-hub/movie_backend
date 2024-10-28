const generateIdPairs = async (ids, combinationSize) => {
    const idArray = Array.from(ids);
    const combinations = [];

    function combine(start, combo) {
        if (combo.length === combinationSize) {
            combinations.push(combo.join(','));
            return;
        }

        for (let i = start; i < idArray.length; i++) {
            combine(i + 1, [...combo, idArray[i]]);
        }
    }

    combine(0, []);
    return combinations;
}
module.exports = generateIdPairs