const Queries = async (collectionModel, queryKeys, searchKeys, populatePath, selectFields) => {
    try {
        const { limit, page, sort, order, ...filters } = queryKeys;

        let query = {};
        // Handle search keys with regex
        if (Object.keys(searchKeys).length > 0) {
            query.$or = Object.keys(searchKeys).map(key => ({
                [key]: { $regex: searchKeys[key], $options: "i" }
            }));
        }
        // Handle filters
        if (filters) {
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    query[key] = filters[key];
                }
            });
        }
        // Handle sorting
        let sortOrder = {};
        if (sort) {
            sortOrder[sort] = order === "desc" ? -1 : 1;
        }
        const itemsPerPage = parseInt(limit) || 10;
        const currentPage = parseInt(page) || 1;
        let queryExec = collectionModel.find(query)
        if (page) {
            queryExec = collectionModel.find(query)
                .sort(sortOrder)
                .skip((currentPage - 1) * itemsPerPage)
                .limit(itemsPerPage);
        } else {
            queryExec = collectionModel.find(query)
                .sort(sortOrder)
        }


        // Handle population logic
        if (populatePath) {
            if (Array.isArray(populatePath)) {
                // If populatePath is an array, loop through and populate each path
                populatePath.forEach((path, index) => {
                    const fields = Array.isArray(selectFields) ? selectFields[index] : selectFields;
                    queryExec = queryExec.populate({
                        path: path,
                        select: fields
                    });
                });
            } else {
                // If populatePath is a string, populate it normally
                if (selectFields) {
                    queryExec = queryExec.populate({
                        path: populatePath,
                        select: selectFields
                    });
                } else {
                    queryExec = queryExec.populate(populatePath);
                }
            }
        }

        const [result, totalItems] = await Promise.all([
            queryExec,
            collectionModel.countDocuments(query)
        ]);
        let responseData = {
            success: true,
            data: result,
        }
        if (page) {
            responseData = {
                success: true,
                data: result,
                pagination: {
                    currentPage,
                    itemsPerPage,
                    totalItems,
                    totalPages: Math.ceil(totalItems / itemsPerPage)
                }
            }
        }
        return responseData;

    } catch (error) {
        throw new Error(error.message || "An error occurred while executing the query");
    }
};

module.exports = Queries;
