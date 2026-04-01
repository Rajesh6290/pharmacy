import { AnimatePresence, motion } from "framer-motion";
import * as lodash from "lodash";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import React, {
  CSSProperties,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

// Base types and interfaces
export type RecordId = string | number;
export type RowIdentifier = string | number;
export interface RecordWithId {
  id?: RecordId;
  [key: string]: unknown;
}

export type Field<T> = keyof T;

export interface ExpandableConfig {
  enabled: boolean;
  maxLines?: number;
  maxCharacters?: number;
  showMoreText?: string;
  showLessText?: string;
}

export interface Column<T> {
  field: Field<T>;
  title: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  headerClassName?: string;
  cellClassName?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  expandable?: ExpandableConfig;
  sticky?: "left" | "right"; // Make column sticky on left or right side
}

export interface Action<T> {
  icon?: React.ReactNode | ((row: T) => React.ReactNode);
  tooltip?: string;
  onClick: (row: T) => void;
  className?: string;
  hidden?: (row: T) => boolean;
}

export interface TableThemeColors {
  headerBg?: string;
  headerText?: string;
  headerBorder?: string;
  headerHover?: string;
  sortIconColor?: string;
}

export interface TableOptions {
  toolbar?: boolean;
  search?: boolean;
  filtering?: boolean;
  sorting?: boolean;
  selection?: boolean;
  export?: boolean;
  pagination?: boolean;
  detailPanel?: boolean;
  detailPanelPosition?: "left" | "right";
  detailPanelHeader?: string;
  tableColor?: string;
  padding?: "normal" | "compact" | "wide";
  pageSize?: number;
  pageSizeOptions?: number[];
  responsive?: boolean;
  stickyHeader?: boolean;
  verticalScroll?: boolean;
  maxHeight?: string;
  theme?: TableThemeColors;
  containerHeight?: string;
  fixedHeight?: boolean;
}

export interface Localization {
  toolbar?: {
    searchPlaceholder?: string;
    exportTitle?: string;
    exportCSV?: string;
    exportPDF?: string;
  };
  pagination?: {
    labelRowsSelect?: string;
    labelDisplayedRows?: string;
  };
  header?: {
    actions?: string;
  };
  body?: {
    emptyDataSourceMessage?: string;
    filterRow?: {
      filterPlaceholder?: string;
    };
  };
}

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  options?: {
    fixedHeight?: boolean;
    containerHeight?: string;
  };
}

export interface ToolbarProps {
  title?: string | undefined;
  onSearch?: (value: string) => void;
  onExport?: (type: "csv" | "pdf") => void;
  searchValue?: string;
  className?: string;
}

export interface PaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
  className?: string;
}

export interface TableComponents {
  container?: React.ComponentType<ContainerProps>;
  toolbar?: React.ComponentType<ToolbarProps>;
  pagination?: React.ComponentType<PaginationProps>;
  loadingOverlay?: React.ComponentType;
  emptyState?: React.ComponentType;
  customToolbar?: React.ComponentType<{ children: React.ReactNode }>;
  detailPanel?: React.ComponentType<{ row: RecordWithId }>;
}

// Ref interface for imperative methods
export interface CVTableRef {
  resetSelection: () => void;
}

export interface CVTableProps<T extends RecordWithId> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  customToolbar?: React.ReactNode;
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (pageSize: number) => void;
  selection?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  defaultOrderBy?: Field<T>;
  defaultOrderDirection?: "asc" | "desc";
  filtering?: boolean;
  actions?: Action<T>[];
  detailPanel?: ((row: T) => React.ReactNode) | React.ReactNode;
  components?: TableComponents;
  options?: TableOptions;
  localization?: Localization;
  className?: string;
  containerClassName?: string;
  getRowClassName?: (row: T) => string;
}

// Default options
const defaultOptions: TableOptions = {
  toolbar: true,
  search: true,
  filtering: false,
  sorting: true,
  selection: false,
  export: true,
  pagination: true,
  detailPanel: false,
  detailPanelPosition: "left",
  detailPanelHeader: "Details",
  tableColor: "bg-tertiary/80",
  padding: "normal",
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
  responsive: true,
  stickyHeader: false,
  verticalScroll: true,
  containerHeight: "400px",
  fixedHeight: false,
  theme: {
    headerBg: "bg-gray-50",
    headerText: "text-tertiary",
    headerBorder: "border-gray-200",
    headerHover: "hover:bg-gray-100",
    sortIconColor: "text-gray-400",
  },
};

// Localization
const defaultLocalization: Localization = {
  toolbar: {
    searchPlaceholder: "Search",
    exportTitle: "Export",
    exportCSV: "Export as CSV",
    exportPDF: "Export as PDF",
  },
  pagination: {
    labelRowsSelect: "rows",
    labelDisplayedRows: "{from}-{to} of {count}",
  },
  header: {
    actions: "Actions",
  },
  body: {
    emptyDataSourceMessage: "No records to display",
    filterRow: {
      filterPlaceholder: "Filter",
    },
  },
};

// Helper function to get unique identifier
const getRowIdentifier = <T extends Record<string, unknown>>(
  row: T,
  index: number
): RowIdentifier => {
  const idFields = ["id", "ID", "_id", "uid", "key"] as const;
  for (const field of idFields) {
    const value = row[field];
    if (
      value !== undefined &&
      value !== null &&
      (typeof value === "string" || typeof value === "number")
    ) {
      return value as RowIdentifier;
    }
  }
  return `${Object.values(row)
    .map((val) => (val !== undefined ? String(val) : ""))
    .join("_")}_${index}`;
};

// Selection hook
const useSelection = <T extends Record<string, unknown>>(
  _: T[],
  onSelectionChange?: (selected: T[]) => void
) => {
  const [selected, setSelected] = useState<Map<RowIdentifier, T>>(new Map());
  const [expandedTextRows, setExpandedTextRows] = useState<Set<string>>(
    new Set()
  );

  const isSelected = useCallback(
    (row: T, index: number) => selected.has(getRowIdentifier(row, index)),
    [selected]
  );

  const toggleTextExpansion = useCallback((rowId: string, field: string) => {
    setExpandedTextRows((prev) => {
      const newSet = new Set(prev);
      const key = `${rowId}-${field}`;
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        // Close all other expanded rows
        const fieldKeys = Array.from(newSet).filter((k) =>
          k.endsWith(`-${field}`)
        );
        fieldKeys.forEach((k) => newSet.delete(k));
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const isTextExpanded = useCallback(
    (rowId: string, field: string) => {
      return expandedTextRows.has(`${rowId}-${field}`);
    },
    [expandedTextRows]
  );

  const toggleSelection = useCallback(
    (row: T, index: number) => {
      setSelected((prev) => {
        const newMap = new Map(prev);
        const id = getRowIdentifier(row, index);
        if (newMap.has(id)) {
          newMap.delete(id);
        } else {
          newMap.set(id, row);
        }
        onSelectionChange?.(Array.from(newMap.values()));
        return newMap;
      });
    },
    [onSelectionChange]
  );

  const toggleAll = useCallback(
    (rows: T[]) => {
      setSelected((prev) => {
        const newMap = new Map(prev);
        const allSelected = rows.every((row, idx) =>
          newMap.has(getRowIdentifier(row, idx))
        );
        if (allSelected) {
          rows.forEach((row, idx) => newMap.delete(getRowIdentifier(row, idx)));
        } else {
          rows.forEach((row, idx) =>
            newMap.set(getRowIdentifier(row, idx), row)
          );
        }
        onSelectionChange?.(Array.from(newMap.values()));
        return newMap;
      });
    },
    [onSelectionChange]
  );

  const isAllSelected = useCallback(
    (rows: T[]) =>
      rows.length > 0 &&
      rows.every((row, idx) => selected.has(getRowIdentifier(row, idx))),
    [selected]
  );

  const clearSelection = useCallback(() => {
    setSelected(new Map());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  return {
    selected,
    isSelected,
    toggleSelection,
    toggleAll,
    isAllSelected,
    clearSelection,
    expandedTextRows,
    toggleTextExpansion,
    isTextExpanded,
  };
};

// Memoized components
const DefaultContainer = React.memo<ContainerProps>(
  ({ children, className = "", options }) => {
    const containerStyle: CSSProperties | undefined = options?.fixedHeight
      ? {
          height: options.containerHeight || "400px",
          display: "flex",
          flexDirection: "column",
        }
      : undefined;

    return (
      <div
        className={`flex flex-col rounded-lg bg-white shadow-sm ${className}`}
        style={containerStyle}
      >
        {children}
      </div>
    );
  }
);
DefaultContainer.displayName = "DefaultContainer";

const DefaultToolbar = React.memo<ToolbarProps>(
  ({ onSearch, onExport, searchValue, className = "" }) => (
    <div className={`flex flex-col border-b p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between">
        <div className="mb-2 flex items-center space-x-2 sm:mb-0">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              placeholder="Search"
              className="w-full rounded-lg border bg-white py-2 pr-4 pl-10 sm:w-auto"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExport?.("csv")}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
);
DefaultToolbar.displayName = "DefaultToolbar";

const CustomToolbarSection = React.memo<{ children: React.ReactNode }>(
  ({ children }) => <div className="h-fit w-full">{children}</div>
);
CustomToolbarSection.displayName = "CustomToolbarSection";

const CustomPagination = React.memo<PaginationProps>(
  ({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    className = "",
  }) => {
    const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));

    const getPageNumbers = useCallback(() => {
      const delta = 2;
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= totalPages; i++) {
        if (
          i === 1 ||
          i === totalPages ||
          (i >= page - delta && i <= page + delta)
        ) {
          range.push(i);
        }
      }

      range.sort((a, b) => a - b);

      for (const i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push("...");
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      return rangeWithDots;
    }, [page, totalPages]);

    const pageNumbers = useMemo(() => getPageNumbers(), [getPageNumbers]);

    return (
      <div
        className={`mt-auto flex flex-wrap items-center justify-between px-4 py-3 ${className}`}
      >
        <div className="mb-2 flex items-center sm:mb-0">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
              onPageChange(0);
            }}
            className="cursor-pointer rounded-lg border px-2 py-1"
          >
            {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border p-1 enabled:hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex space-x-1">
            {pageNumbers.map((num, index) => (
              <button
                key={index}
                onClick={() =>
                  typeof num === "number" ? onPageChange(num - 1) : undefined
                }
                disabled={num === "..."}
                className={`rounded-lg border px-3 py-1 ${
                  num === page + 1
                    ? "border-tertiary bg-tertiary text-white"
                    : "enabled:hover:bg-gray-50"
                } ${num === "..." ? "cursor-default" : ""}`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border p-1 enabled:hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="text-sm whitespace-nowrap text-gray-700">
          {count > 0
            ? `${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, count)} of ${count}`
            : "0 of 0"}
        </div>
      </div>
    );
  }
);
CustomPagination.displayName = "CustomPagination";

const DefaultDetailPanel = React.memo<{ row: RecordWithId }>(({ row }) => (
  <div className="bg-gray-50 p-4">
    <pre className="text-sm text-gray-700">{JSON.stringify(row, null, 2)}</pre>
  </div>
));
DefaultDetailPanel.displayName = "DefaultDetailPanel";

// Main component implementation with forwardRef
const CustomTable = forwardRef(
  <T extends Record<string, unknown>>(
    {
      columns,
      data = [],
      title,
      customToolbar,
      isLoading = false,
      page = 0,
      pageSize,
      totalCount,
      onPageChange,
      onRowsPerPageChange,
      selection = false,
      onSelectionChange,
      defaultOrderBy,
      defaultOrderDirection = "asc",
      filtering = false,
      actions = [],
      detailPanel,
      components = {},
      options: userOptions = {},
      localization: userLocalization = {},
      className = "",
      containerClassName = "",
      getRowClassName,
    }: CVTableProps<T>,
    ref: React.Ref<CVTableRef>
  ) => {
    // Memoized options and localization
    const options = useMemo(
      () => ({ ...defaultOptions, ...userOptions }),
      [userOptions]
    );
    const localization = useMemo(
      () => lodash.merge({}, defaultLocalization, userLocalization),
      [userLocalization]
    );

    // State management
    const [orderBy, setOrderBy] = useState<Field<T> | undefined>(
      defaultOrderBy
    );
    const [orderDirection, setOrderDirection] = useState<"asc" | "desc">(
      defaultOrderDirection
    );
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [searchText, setSearchText] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<RowIdentifier>>(
      new Set()
    );
    const [visibleColumns] = useState<Record<string, boolean>>(() =>
      columns.reduce(
        (acc, col) => ({ ...acc, [col.field as string]: !col.hidden }),
        {}
      )
    );

    // Sticky columns support
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Calculate sticky column positions
    const stickyColumnPositions = useMemo(() => {
      const positions = new Map<string, { left?: string; right?: string }>();
      let leftOffset = 0;
      let rightOffset = 0;

      // Calculate left sticky positions
      const leftStickyColumns = columns.filter((col) => col.sticky === "left");
      for (const col of leftStickyColumns) {
        positions.set(col.field as string, { left: `${leftOffset}px` });
        leftOffset += parseInt(col.width || "150");
      }

      // Calculate right sticky positions
      const rightStickyColumns = columns
        .filter((col) => col.sticky === "right")
        .reverse();
      for (const col of rightStickyColumns) {
        positions.set(col.field as string, { right: `${rightOffset}px` });
        rightOffset += parseInt(col.width || "150");
      }

      return positions;
    }, [columns]);

    // Selection handling
    const {
      isSelected,
      toggleSelection,
      toggleAll,
      isAllSelected,
      clearSelection,
      toggleTextExpansion,
      isTextExpanded,
    } = useSelection(data, onSelectionChange);

    const [currentPage, setCurrentPage] = useState(page);
    const [currentPageSize, setCurrentPageSize] = useState<number>(() => {
      if (pageSize !== undefined) {
        return pageSize;
      }
      if (options.fixedHeight) {
        const rowHeight =
          options.padding === "compact"
            ? 48
            : options.padding === "wide"
              ? 72
              : 56;
        const availableHeight =
          parseInt(options.containerHeight || "400") - 176;
        return Math.max(1, Math.floor(availableHeight / rowHeight));
      }
      return options.pageSize ?? defaultOptions.pageSize ?? 10;
    });

    // Expose resetSelection method via ref
    useImperativeHandle(ref, () => ({
      resetSelection: () => {
        clearSelection();
      },
    }));

    // Event handlers
    const handleSearch = useCallback((value: string) => {
      setSearchText(value);
    }, []);

    const handlePageChange = useCallback(
      (newPage: number) => {
        setCurrentPage(newPage);
        onPageChange?.(newPage);
      },
      [onPageChange]
    );

    const handleRowsPerPageChange = useCallback(
      (newPageSize: number) => {
        setCurrentPageSize(newPageSize);
        setCurrentPage(0);
        onRowsPerPageChange?.(newPageSize);
      },
      [onRowsPerPageChange]
    );

    const handleSort = useCallback((field: Field<T>) => {
      setOrderBy(field);
      setOrderDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    }, []);

    const handleFilter = useCallback((field: string, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    }, []);

    const handleExport = useCallback(() => {
      // Implement export functionality
    }, []);

    const toggleRowExpansion = useCallback((rowId: RowIdentifier) => {
      setExpandedRows((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(rowId)) {
          newSet.delete(rowId);
        } else {
          newSet.add(rowId);
        }
        return newSet;
      });
    }, []);

    // Memoized data processing
    const processData = useCallback(
      (inputData: T[]): T[] => {
        let processed = [...inputData];

        if (totalCount === undefined) {
          if (searchText) {
            processed = processed.filter((row) =>
              columns.some((column) => {
                const value = row[column.field];
                return value
                  ?.toString()
                  .toLowerCase()
                  .includes(searchText.toLowerCase());
              })
            );
          }

          Object.entries(filters).forEach(([field, value]) => {
            if (value) {
              processed = processed.filter((row) => {
                const cellValue = row[field as keyof T];
                return cellValue
                  ?.toString()
                  .toLowerCase()
                  .includes(value.toLowerCase());
              });
            }
          });

          if (orderBy) {
            processed = lodash.orderBy(processed, [orderBy], [orderDirection]);
          }
        }

        return processed;
      },
      [columns, filters, orderBy, orderDirection, searchText, totalCount]
    );

    const processedData = useMemo(() => processData(data), [data, processData]);
    const displayData = useMemo(() => {
      if (totalCount !== undefined) {
        return processedData;
      }
      if (!options.pagination) {
        return processedData;
      }
      return processedData.slice(
        currentPage * currentPageSize,
        (currentPage + 1) * currentPageSize
      );
    }, [
      currentPage,
      currentPageSize,
      options.pagination,
      processedData,
      totalCount,
    ]);

    const effectiveTotalCount =
      totalCount !== undefined ? totalCount : processedData.length;

    // Component resolution
    const {
      container: Container = DefaultContainer,
      toolbar: Toolbar = DefaultToolbar,
      customToolbar: CustomToolbar = CustomToolbarSection,
      pagination: Pagination = CustomPagination,
      loadingOverlay: LoadingOverlay = () => (
        <div className="flex w-full items-center justify-center py-12">
          <div className="border-tertiary h-16 w-16 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
        </div>
      ),
      emptyState: EmptyState = () => (
        <div className="py-12 text-center">
          <p className="text-gray-500">
            {localization.body?.emptyDataSourceMessage}
          </p>
        </div>
      ),
      detailPanel: DetailPanel = DefaultDetailPanel,
    } = components;

    // Animation variants for Framer Motion
    const detailVariants = {
      hidden: { height: 0, opacity: 0 },
      visible: { height: "auto", opacity: 1 },
    };

    // Render
    return (
      <div className={`relative h-fit ${containerClassName}`}>
        <span
          className={`absolute top-0 left-0 z-30 h-full w-1.5 rounded-l-2xl ${options.tableColor}`}
        ></span>
        <Container className={className} options={options}>
          {title && (
            <h2 className="py-3 pl-5 text-lg font-semibold text-gray-900">
              {title}
            </h2>
          )}

          {options.toolbar && (
            <Toolbar
              title={title}
              onSearch={handleSearch}
              searchValue={searchText}
              onExport={handleExport}
              className="border-b"
            />
          )}

          {customToolbar && <CustomToolbar>{customToolbar}</CustomToolbar>}

          <div className="relative flex-1">
            {/* Loader - Shows in center over table when loading with previous data */}
            {isLoading && data.length > 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
                <div className="flex items-center justify-center">
                  <div className="border-tertiary h-16 w-16 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
                </div>
              </div>
            )}
            <div
              ref={tableContainerRef}
              className={`w-full ${options.verticalScroll ? "overflow-y-auto" : ""} overflow-x-auto`}
              style={
                options.fixedHeight
                  ? {
                      flex: "1 1 0%",
                      overflow: "auto",
                      maxHeight: options.maxHeight || "unset",
                    }
                  : {}
              }
            >
              <table className="w-full table-auto border-collapse border border-gray-200">
                <thead
                  className={`${options.theme?.headerBg || "bg-gray-50"} ${options.stickyHeader ? "sticky top-0 z-10" : ""}`}
                >
                  <tr>
                    {selection && (
                      <th className="w-12 border border-gray-200 p-2">
                        <input
                          type="checkbox"
                          checked={isAllSelected(displayData)}
                          onChange={() => toggleAll(displayData)}
                          className="mx-2 size-4 cursor-pointer rounded border-gray-300"
                        />
                      </th>
                    )}
                    {options.detailPanel &&
                      options.detailPanelPosition === "left" && (
                        <th
                          className={`border border-gray-200 px-4 py-2 text-center text-sm font-bold tracking-wider uppercase ${options.theme?.headerText}`}
                        >
                          {options.detailPanelHeader}
                        </th>
                      )}
                    {columns.map(
                      (column) =>
                        visibleColumns[column.field as string] && (
                          <th
                            key={column.field as string}
                            className={`p-2 text-center text-xs font-medium ${
                              options.theme?.headerText || "text-gray-500"
                            } border border-gray-200 tracking-wider uppercase select-none ${
                              column.sortable !== false && options.sorting
                                ? `cursor-pointer ${options.theme?.headerHover || "hover:bg-gray-100"}`
                                : ""
                            } ${column.headerClassName || ""} ${
                              column.sticky
                                ? `sticky z-20 ${options.theme?.headerBg || "bg-gray-50"}`
                                : ""
                            }`}
                            onClick={() =>
                              column.sortable !== false &&
                              options.sorting &&
                              handleSort(column.field)
                            }
                            style={{
                              width: column.width,
                              minWidth: column.minWidth,
                              maxWidth: column.maxWidth,
                              ...(column.sticky
                                ? {
                                    ...stickyColumnPositions.get(
                                      column.field as string
                                    ),
                                    borderRight:
                                      column.sticky === "left"
                                        ? "1px solid"
                                        : undefined,
                                    borderLeft:
                                      column.sticky === "right"
                                        ? "1px solid"
                                        : undefined,
                                    borderColor: "inherit",
                                  }
                                : {}),
                            }}
                          >
                            <div className="flex w-full items-center justify-center space-x-1">
                              <span className="text-sm font-bold text-nowrap">
                                {column.title}
                              </span>
                              {column.sortable !== false &&
                                options.sorting &&
                                orderBy === column.field &&
                                (orderDirection === "asc" ? (
                                  <SortAsc
                                    className={`h-4 w-4 ${options.theme?.sortIconColor || "text-gray-400"}`}
                                  />
                                ) : (
                                  <SortDesc
                                    className={`h-4 w-4 ${options.theme?.sortIconColor || "text-gray-400"}`}
                                  />
                                ))}
                            </div>
                          </th>
                        )
                    )}
                    {actions.length > 0 && (
                      <th className="text-tertiary w-fit border border-gray-200 p-2 text-center text-sm font-bold tracking-wider text-nowrap uppercase">
                        {localization.header?.actions || "Actions"}
                      </th>
                    )}
                    {options.detailPanel &&
                      options.detailPanelPosition === "right" && (
                        <th
                          className={`border border-gray-200 px-4 py-2 text-center text-sm font-bold tracking-wider text-nowrap uppercase ${options.theme?.headerText}`}
                        >
                          {options.detailPanelHeader}
                        </th>
                      )}
                  </tr>

                  {filtering && (
                    <tr>
                      {selection && <th />}
                      {options.detailPanel &&
                        options.detailPanelPosition === "left" && <th />}
                      {columns.map(
                        (column) =>
                          visibleColumns[column.field as string] &&
                          column.filterable !== false && (
                            <th
                              key={column.field as string}
                              className={`W:border-white/10 dark flex size-full items-center justify-center border border-gray-200 px-6 py-2 ${
                                column.sticky
                                  ? `sticky z-20 ${options.theme?.headerBg || "bg-gray-50"}`
                                  : ""
                              }`}
                              style={{
                                ...(column.sticky
                                  ? {
                                      ...stickyColumnPositions.get(
                                        column.field as string
                                      ),
                                      borderRight:
                                        column.sticky === "left"
                                          ? "1px solid"
                                          : undefined,
                                      borderLeft:
                                        column.sticky === "right"
                                          ? "1px solid"
                                          : undefined,
                                      borderColor: "inherit",
                                    }
                                  : {}),
                              }}
                            >
                              <input
                                type="text"
                                placeholder={
                                  localization.body?.filterRow
                                    ?.filterPlaceholder
                                }
                                className="w-full rounded border px-2 py-1 text-sm"
                                onChange={(e) =>
                                  handleFilter(
                                    column.field as string,
                                    e.target.value
                                  )
                                }
                                value={filters[column.field as string] || ""}
                              />
                            </th>
                          )
                      )}
                      {actions.length > 0 && <th />}
                      {options.detailPanel &&
                        options.detailPanelPosition === "right" && <th />}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading && data?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          columns.length +
                          (selection ? 1 : 0) +
                          (actions.length > 0 ? 1 : 0) +
                          (options.detailPanel ? 1 : 0)
                        }
                        className="border border-gray-200"
                      >
                        <LoadingOverlay />
                      </td>
                    </tr>
                  ) : displayData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={
                          columns.length +
                          (selection ? 1 : 0) +
                          (actions.length > 0 ? 1 : 0) +
                          (options.detailPanel ? 1 : 0)
                        }
                        className="border border-gray-200"
                      >
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    displayData.map((row, rowIndex) => {
                      const rowId = getRowIdentifier(row, rowIndex);
                      const isExpanded = expandedRows.has(rowId);
                      const customRowClass = getRowClassName?.(row) || "";

                      return (
                        <React.Fragment key={rowId}>
                          <tr
                            className={`transition-all duration-200 hover:bg-gray-50 ${customRowClass}`}
                          >
                            {selection && (
                              <td
                                className={`w-12 border border-gray-200 p-2 text-center ${isExpanded ? "blur-sm" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected(row, rowIndex)}
                                  onChange={() =>
                                    toggleSelection(row, rowIndex)
                                  }
                                  className="mx-auto block size-4 cursor-pointer rounded border-gray-100"
                                />
                              </td>
                            )}
                            {options.detailPanel &&
                              options.detailPanelPosition === "left" && (
                                <td className="w-12 border border-gray-200 p-2 text-center">
                                  <div
                                    tabIndex={0}
                                    role="button"
                                    onClick={() => toggleRowExpansion(rowId)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        toggleRowExpansion(rowId);
                                      }
                                    }}
                                    className="flex cursor-pointer items-center justify-center text-gray-400 hover:text-gray-600"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="size-6 -rotate-180" />
                                    ) : (
                                      <ChevronDown className="size-6 -rotate-90" />
                                    )}
                                  </div>
                                </td>
                              )}
                            {columns.map((column, columnIndex) => {
                              const visibleColumnCount =
                                Object.values(visibleColumns).filter(
                                  Boolean
                                ).length;
                              const isLastVisibleColumn =
                                columnIndex === visibleColumnCount - 1;
                              return visibleColumns[column.field as string] ? (
                                <td
                                  key={column.field as string}
                                  className={`border border-gray-200 p-2 ${isExpanded ? "blur-sm" : ""} text-center text-sm text-gray-900 ${
                                    column.cellClassName || ""
                                  } ${
                                    options.detailPanel &&
                                    ((options.detailPanelPosition === "left" &&
                                      columnIndex === 0) ||
                                      (options.detailPanelPosition ===
                                        "right" &&
                                        isLastVisibleColumn))
                                      ? "cursor-pointer hover:bg-gray-100"
                                      : ""
                                  } ${
                                    column.sticky ? "sticky z-10 bg-white" : ""
                                  }`}
                                  style={{
                                    ...(column.sticky
                                      ? {
                                          ...stickyColumnPositions.get(
                                            column.field as string
                                          ),
                                          borderRight:
                                            column.sticky === "left"
                                              ? "1px solid"
                                              : undefined,
                                          borderLeft:
                                            column.sticky === "right"
                                              ? "1px solid"
                                              : undefined,
                                          borderColor: "inherit",
                                        }
                                      : {}),
                                  }}
                                  onClick={
                                    options.detailPanel &&
                                    ((options.detailPanelPosition === "left" &&
                                      columnIndex === 0) ||
                                      (options.detailPanelPosition ===
                                        "right" &&
                                        isLastVisibleColumn))
                                      ? () => toggleRowExpansion(rowId)
                                      : undefined
                                  }
                                >
                                  <div>
                                    {column.expandable?.enabled
                                      ? (() => {
                                          const fieldKey = String(column.field);
                                          const text = column.render
                                            ? String(
                                                column.render(row) ||
                                                  "Not Provided"
                                              )
                                            : String(
                                                row[column.field] ||
                                                  "Not Provided"
                                              );
                                          const expanded = isTextExpanded(
                                            String(rowId),
                                            fieldKey
                                          );
                                          const lines = text.split("\n");
                                          const maxLines =
                                            column.expandable.maxLines;
                                          const maxChars =
                                            column.expandable.maxCharacters;

                                          // Check if truncation is needed
                                          const exceedsLines =
                                            maxLines && lines.length > maxLines;
                                          const exceedsChars =
                                            maxChars && text.length > maxChars;

                                          // For line clamping: also check if text is long enough to wrap
                                          // Assume ~50 chars per line as a rough estimate for wrapping
                                          // (accounts for typical column width constraints in table layouts)
                                          const estimatedCharsPerLine = 50;
                                          const likelyToWrap =
                                            maxLines &&
                                            !maxChars &&
                                            text.length >
                                              maxLines * estimatedCharsPerLine;

                                          const shouldShowMore =
                                            exceedsLines ||
                                            exceedsChars ||
                                            likelyToWrap;

                                          // Build inline styles for line clamping
                                          const clampStyles: CSSProperties =
                                            !expanded && maxLines
                                              ? {
                                                  display: "-webkit-box",
                                                  WebkitLineClamp: maxLines,
                                                  WebkitBoxOrient: "vertical",
                                                  overflow: "hidden",
                                                }
                                              : {};

                                          return (
                                            <div className="text-left">
                                              <motion.div
                                                key={`${rowId}-${fieldKey}-${expanded}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                              >
                                                <div style={clampStyles}>
                                                  {text}
                                                </div>
                                              </motion.div>
                                              {shouldShowMore && (
                                                <motion.button
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleTextExpansion(
                                                      String(rowId),
                                                      fieldKey
                                                    );
                                                  }}
                                                  className="text-tertiary-600 hover:text-tertiary-800 ml-1 text-sm font-medium underline"
                                                >
                                                  {expanded
                                                    ? column.expandable
                                                        .showLessText ||
                                                      "Show Less"
                                                    : column.expandable
                                                        .showMoreText ||
                                                      "Show More"}
                                                </motion.button>
                                              )}
                                            </div>
                                          );
                                        })()
                                      : column.render
                                        ? column.render(row)
                                        : String(row[column.field] ?? "")}
                                  </div>
                                </td>
                              ) : null;
                            })}
                            {actions.length > 0 && (
                              <td
                                className={`w-fit border border-gray-200 p-2 text-right text-sm font-medium ${isExpanded ? "blur-sm" : ""}`}
                              >
                                <div className="flex w-full items-center justify-center space-x-2">
                                  {actions.map(
                                    (action, actionIndex) =>
                                      !action.hidden?.(row) && (
                                        <div
                                          key={actionIndex}
                                          tabIndex={0}
                                          role="button"
                                          onClick={() => action.onClick(row)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              action.onClick(row);
                                            }
                                          }}
                                          className={
                                            action.className ||
                                            "text-tertiary-600 hover:text-tertiary-900 cursor-pointer"
                                          }
                                          title={action.tooltip}
                                        >
                                          {typeof action.icon === "function"
                                            ? action.icon(row)
                                            : action.icon}
                                        </div>
                                      )
                                  )}
                                </div>
                              </td>
                            )}
                            {options.detailPanel &&
                              options.detailPanelPosition === "right" && (
                                <td className="w-12 border border-gray-200 p-2 text-center">
                                  <div
                                    tabIndex={0}
                                    role="button"
                                    onClick={() => toggleRowExpansion(rowId)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        toggleRowExpansion(rowId);
                                      }
                                    }}
                                    className="flex cursor-pointer items-center justify-center text-gray-500 hover:text-gray-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="size-6 -rotate-180" />
                                    ) : (
                                      <ChevronDown className="size-6 -rotate-90" />
                                    )}
                                  </div>
                                </td>
                              )}
                          </tr>

                          {options.detailPanel && expandedRows.has(rowId) && (
                            <tr key={`${rowId}-detail`}>
                              <td
                                colSpan={
                                  columns.length +
                                  (selection ? 1 : 0) +
                                  (actions.length > 0 ? 1 : 0) +
                                  (options.detailPanel ? 1 : 0)
                                }
                                className="border border-gray-200"
                              >
                                <AnimatePresence>
                                  <motion.div
                                    key={`${rowId}-motion`}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={detailVariants}
                                    transition={{
                                      duration: 0.3,
                                      ease: "easeInOut",
                                    }}
                                  >
                                    {detailPanel ? (
                                      typeof detailPanel === "function" ? (
                                        <div className="p-4">
                                          {detailPanel(row)}
                                        </div>
                                      ) : (
                                        <div className="p-4">{detailPanel}</div>
                                      )
                                    ) : (
                                      <DetailPanel row={row} />
                                    )}
                                  </motion.div>
                                </AnimatePresence>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {options.pagination && effectiveTotalCount > 0 && (
            <Pagination
              count={effectiveTotalCount}
              page={currentPage}
              rowsPerPage={currentPageSize}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </Container>
      </div>
    );
  }
);

CustomTable.displayName = "CustomTable";

export default CustomTable as <T extends Record<string, unknown>>(
  props: CVTableProps<T> & { ref?: React.Ref<CVTableRef> }
) => React.ReactElement;
