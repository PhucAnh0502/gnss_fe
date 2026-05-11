import { flexRender } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

export function HistoryTable({ table, historyData, isLoading, selectedDeviceId }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      {historyData.length === 0 && !isLoading ? (
        <div className="p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {selectedDeviceId ? 'No tracking data found for the selected period' : 'Select a device to view history'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-2 hover:text-white transition-colors"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() && (
                            <span className="text-blue-400">
                              {header.column.getIsSorted() === 'desc' ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </span>
                          )}
                        </button>
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/30">
              <div className="text-sm text-slate-400">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · Total: {historyData.length} records
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 py-1 text-sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 py-1 text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}