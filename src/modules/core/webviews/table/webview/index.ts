import { onConfigLoad } from "../../webview-helper/config";
import { onConnectionConfigLoad } from "../../webview-helper/connectionConfig";
import { registerShortcuts } from "../../webview-helper/registerShortcuts";
import { vscode } from "../../webview-helper/vscode";
import { renderAddRow } from "./addRow";
import { renderDeleteRows } from "./deleteRows";
import { removeErrorMessage, showErrorMessage } from "./error";
import { renderFilterInput, renderFilterOptions, setActiveFilterAndFocus } from "./filter";
import { setLoading } from "./loading";
import { setTableRowsOriginal } from "./orderBy";
import { renderPagination, renderPaginationSelect, setPageResultsLimit, updatePagination } from "./pagination";
import "./popup";
import { onPushChangesClick, renderPushChanges, updateOnPushChangesState, updatePushChangesLoadingState } from "./push";
import { getQueryResult, openQueriesPreview, requestExecuteQueryFetch, setQueryResult, setQueryResultChanges, setQueryResultDeletions, setQueryResultInsertions, setQueryResultTimeInMilliseconds, updateQueryTimeInMilliseconds } from "./query";
import { renderTable, renderTableResult } from "./table";
import { renderSelectionMode, setEditMode, toggleSelectionMode, updateSelectionMode } from "./tableSelectionMode";

let reloadElement: HTMLElement | null;

window.addEventListener('message', event => {
    removeErrorMessage();
    const message = event.data;

    if (message.command === "query.execute.fetch.result") {
        setQueryResultChanges({});
        setQueryResultDeletions([]);
        setQueryResultInsertions({});
        setQueryResult(message.payload);
        updatePagination(getQueryResult()?.stats.rowCount || 0);
        renderTableResult();
        setLoading(false);
        setTableRowsOriginal(null);
    }

    if (message.command === "query.execute.preview.result") {
        openQueriesPreview(message.payload);
    }

    if (message.command === "query.execute.rawQuery.result") {
        setQueryResultChanges({});
        setQueryResultDeletions([]);
        setQueryResultInsertions({});
        setQueryResult(message.payload);
        updatePagination(getQueryResult()?.rows?.length || 0, true);
        renderTableResult();
        setLoading(false);
        setTableRowsOriginal(null);
    }

    if (message.command === "query.execute.update.result") {
        updatePushChangesLoadingState(false);
        // clear data changes, as its a new page with new data
        setQueryResultChanges({});
        setQueryResult(message.payload);
        updatePagination(getQueryResult()?.stats.rowCount || 0);
        renderTableResult();
    }

    if (message.command.includes('error')) {
        setTableRowsOriginal(null);
        setLoading(false);
        updatePushChangesLoadingState(false);
        showErrorMessage(`[${message.command}] Failed\n"${message.payload}`);
        setQueryResultTimeInMilliseconds(0);
    }

    if (message.command === "query.execute.insert.result") {
        updatePushChangesLoadingState(false);
        // clear data changes, as its a new page with new data
        setQueryResultInsertions({});
        setQueryResult(message.payload);
        updatePagination(getQueryResult()?.stats.rowCount || 0);
        renderTableResult();
    }

    if (message.command === "query.execute.delete.result") {
        updatePushChangesLoadingState(false);
        setQueryResultDeletions([]);
        setQueryResultChanges({});
        setQueryResult(message.payload);
        updatePagination(getQueryResult()?.stats.rowCount || 0);
        renderTableResult();
    }

    updateOnPushChangesState();
    updateQueryTimeInMilliseconds();
    updateSelectionMode();
});


reloadElement = document.getElementById("reload");

onConfigLoad((config => {
    setPageResultsLimit(config.table.pageResultsLimit);
    renderPaginationSelect(config.table.pageResultsLimitOptions);
    requestExecuteQueryFetch();
    setEditMode(config.table.defaultEditMode);
}));
onConnectionConfigLoad(renderFilterOptions);
renderPagination();
renderTable();
renderPushChanges();
renderReload();
renderFilterInput();
renderSelectionMode();
renderAddRow();
renderDeleteRows();
registerShortcuts([
    {
        keys: {
            Control: true,
            s: true,
        },
        callback: toggleSelectionMode
    },
    {
        keys: {
            Control: true,
            f: true,
        },
        callback: () => setActiveFilterAndFocus('client')
    },
    {
        keys: {
            Alt: true,
            d: true,
        },
        callback: () => setActiveFilterAndFocus('database')
    },
    {
        keys: {
            Alt: true,
            q: true,
        },
        callback: () => setActiveFilterAndFocus('query')
    },
    {
        keys: {
            Control: true,
            R: true,
        },
        callback: requestExecuteQueryFetch
    },
    {
        keys: {
            Control: true,
            Enter: true,
        },
        callback: onPushChangesClick
    }
]);

function renderReload() {
    if (!reloadElement) {
        return;
    };
    reloadElement.onclick = () => {
        requestExecuteQueryFetch();
    };
}

document.getElementById('settings')?.addEventListener('click', () => {
    vscode.postMessage({
        command: 'workbench.action.openSettings',
        payload: 'SmileDB.table'
    });
});