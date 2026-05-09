import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Eye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { OwnerListingDialog } from "@/components/site/OwnerListingDialog";
import {
  adminIconButtonClass,
  adminInputClass,
  adminPageDescriptionClass,
  adminPageTitleClass,
  adminSelectClass,
  adminStrongCellClass,
  adminSubtleSurfaceClass,
  adminSurfaceClass,
  adminTableCellClass,
  adminTableHeadClass,
  adminTableHeaderCellClass,
  adminTableRowClass,
  getPropertyStatusClass,
} from "@/components/admin/adminTheme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  approveProperty,
  deleteProperty,
  getAdminProperties,
  updatePropertyStatus,
} from "@/integrations/supabase/admin";
import type { PropertyRow } from "@/integrations/supabase/database";
import { cn } from "@/lib/utils";

type AdminPropertyListItem = {
  id: string;
  title: string;
  price: number;
  city: string;
  property_type: PropertyRow["property_type"];
  listing_type: PropertyRow["listing_type"];
  status: PropertyRow["status"];
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  owner_id: string;
  owner_display_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
};

export const Route = createFileRoute("/admin/properties")({
  head: () => ({
    title: "Property Management - Admin",
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [properties, setProperties] = useState<AdminPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await getAdminProperties({
        search,
        status: statusFilter || undefined,
        limit: 50,
      });

      if (error) {
        throw error;
      }

      setProperties((data ?? []) as AdminPropertyListItem[]);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleStatusChange = async (propertyId: string, newStatus: PropertyRow["status"]) => {
    try {
      const { error } = await updatePropertyStatus(propertyId, newStatus);
      if (error) {
        throw error;
      }

      setProperties((currentProperties) =>
        currentProperties.map((property) =>
          property.id === propertyId ? { ...property, status: newStatus } : property,
        ),
      );
      toast.success("Status updated");
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleApprove = async (propertyId: string) => {
    try {
      const { error } = await approveProperty(propertyId);
      if (error) {
        throw error;
      }

      setProperties((currentProperties) =>
        currentProperties.map((property) =>
          property.id === propertyId
            ? {
                ...property,
                status: "active" as const,
                is_verified: true,
              }
            : property,
        ),
      );
      toast.success("Listing approved and published");
    } catch (error) {
      console.error("Failed to approve property:", error);
      toast.error("Failed to approve property");
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm("Delete this property listing?")) {
      return;
    }

    try {
      const { error, cleanupError } = await deleteProperty(propertyId);
      if (error) {
        throw error;
      }

      setProperties((currentProperties) =>
        currentProperties.filter((property) => property.id !== propertyId),
      );
      if (selectedListingId === propertyId) {
        setSelectedListingId(null);
      }
      if (cleanupError) {
        console.error("Property deleted but image cleanup failed:", cleanupError);
        toast.error("Property deleted, but some storage images could not be removed");
        return;
      }

      toast.success("Property deleted");
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
    }
  };

  const syncProperty = (updatedProperty: PropertyRow) => {
    setProperties((currentProperties) =>
      currentProperties.map((property) =>
        property.id === updatedProperty.id
          ? {
              ...property,
              title: updatedProperty.title,
              price: updatedProperty.price,
              city: updatedProperty.city,
              property_type: updatedProperty.property_type,
              listing_type: updatedProperty.listing_type,
              status: updatedProperty.status,
              is_verified: updatedProperty.is_verified,
              is_featured: updatedProperty.is_featured,
            }
          : property,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Property Management</h1>
        <p className={adminPageDescriptionClass}>
          Review pending listings, correct submitted details, and approve properties before they
          appear publicly.
        </p>
      </div>

      <Card className={cn(adminSurfaceClass, "p-6")}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              size={18}
            />
            <input
              placeholder="Search properties..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={cn("h-11 w-full rounded-xl pl-11", adminInputClass)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={adminSelectClass}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending approval</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button onClick={fetchProperties} className="h-11 rounded-xl px-5">
            Refresh
          </Button>
        </div>
      </Card>

      <Card className={cn(adminSurfaceClass, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className={adminTableHeadClass}>
              <tr>
                <th className={adminTableHeaderCellClass}>Title</th>
                <th className={adminTableHeaderCellClass}>Price</th>
                <th className={adminTableHeaderCellClass}>Location</th>
                <th className={adminTableHeaderCellClass}>Type</th>
                <th className={adminTableHeaderCellClass}>Status</th>
                <th className={cn(adminTableHeaderCellClass, "text-center")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Loading properties...
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No properties found
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className={adminTableRowClass}>
                    <td className="px-6 py-4">
                      <div className={cn(adminStrongCellClass, "max-w-xs truncate")}>
                        {property.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {property.owner_display_name || property.owner_email || "Unknown owner"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-300">
                      Rs. {Number(property.price ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className={adminTableCellClass}>{property.city}</td>
                    <td className={adminTableCellClass}>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            adminSubtleSurfaceClass,
                            "inline-flex px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:text-slate-200",
                          )}
                        >
                          {property.property_type}
                        </span>
                        <span
                          className={cn(
                            adminSubtleSurfaceClass,
                            "inline-flex px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:text-slate-200",
                          )}
                        >
                          {property.listing_type}
                        </span>
                        {property.is_featured ? (
                          <span className="inline-flex rounded-full bg-amber-500/12 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className={adminTableCellClass}>
                      <div className="space-y-2">
                        <select
                          value={property.status}
                          onChange={(event) =>
                            handleStatusChange(
                              property.id,
                              event.target.value as PropertyRow["status"],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold shadow-sm outline-none",
                            getPropertyStatusClass(property.status),
                          )}
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="sold">Sold</option>
                          <option value="rented">Rented</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {property.is_verified ? "Verified and public" : "Waiting for approval"}
                        </div>
                      </div>
                    </td>
                    <td className={cn(adminTableCellClass, "text-center")}>
                      <div className="flex justify-center gap-1">
                        {!property.is_verified || property.status !== "active" ? (
                          <button
                            type="button"
                            onClick={() => handleApprove(property.id)}
                            className={cn(
                              adminIconButtonClass,
                              "text-emerald-600 dark:text-emerald-300",
                            )}
                            title="Approve and publish"
                          >
                            <CheckCircle size={16} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSelectedListingId(property.id)}
                          className={adminIconButtonClass}
                          title="View and edit listing"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(property.id)}
                          className={cn(adminIconButtonClass, "text-rose-600 dark:text-rose-300")}
                          title="Delete property"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <OwnerListingDialog
        listingId={selectedListingId}
        open={selectedListingId != null}
        mode="admin"
        onOpenChange={(open) => {
          if (!open) {
            setSelectedListingId(null);
          }
        }}
        onSaved={syncProperty}
      />
    </div>
  );
}
