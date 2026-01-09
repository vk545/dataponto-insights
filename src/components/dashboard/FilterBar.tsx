import { Calendar, Building2, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  filters: {
    dateStart: string;
    dateEnd: string;
    company: string;
    collaborator?: string;
    seller?: string;
    product?: string;
  };
  options: {
    companies: { value: string; label: string }[];
    collaborators?: { value: string; label: string }[];
    sellers?: { value: string; label: string }[];
    products?: { value: string; label: string }[];
  };
  onFilterChange: (key: string, value: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function FilterBar({
  filters,
  options,
  onFilterChange,
  onRefresh,
  isLoading,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange("dateStart", e.target.value)}
            className="h-9 w-[140px] text-sm"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange("dateEnd", e.target.value)}
            className="h-9 w-[140px] text-sm"
          />
        </div>
      </div>

      {/* Company Filter */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
          <Building2 className="h-4 w-4 text-secondary" />
        </div>
        <Select
          value={filters.company}
          onValueChange={(value) => onFilterChange("company", value)}
        >
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas</SelectItem>
            {options.companies.map((company) => (
              <SelectItem key={company.value} value={company.value}>
                {company.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Collaborator Filter (optional) */}
      {options.collaborators && (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
            <User className="h-4 w-4 text-info" />
          </div>
          <Select
            value={filters.collaborator || "Todos"}
            onValueChange={(value) => onFilterChange("collaborator", value)}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="Colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {options.collaborators.map((collab) => (
                <SelectItem key={collab.value} value={collab.value}>
                  {collab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Seller Filter (optional) */}
      {options.sellers && (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
            <User className="h-4 w-4 text-success" />
          </div>
          <Select
            value={filters.seller || ""}
            onValueChange={(value) => onFilterChange("seller", value)}
          >
            <SelectTrigger className="h-9 w-[160px] text-sm">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {options.sellers.map((seller) => (
                <SelectItem key={seller.value} value={seller.value}>
                  {seller.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Product Filter (optional) */}
      {options.products && (
        <Select
          value={filters.product || ""}
          onValueChange={(value) => onFilterChange("product", value)}
        >
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {options.products.map((product) => (
              <SelectItem key={product.value} value={product.value}>
                {product.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Refresh Button */}
      <Button
        onClick={onRefresh}
        disabled={isLoading}
        className="ml-auto gap-2 gradient-primary text-primary-foreground hover:opacity-90"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Atualizar</span>
      </Button>
    </div>
  );
}
