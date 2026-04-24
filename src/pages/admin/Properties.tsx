import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { usePropertyDetail } from "@/components/admin/PropertyDetailContext";
import { format } from "date-fns";

const Properties = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [listingType, setListingType] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const { openProperty } = usePropertyDetail();

  const { data: cities = [] } = useQuery({
    queryKey: ["property-cities"],
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("city").not("city", "is", null);
      const uniq = Array.from(new Set((data ?? []).map((r: { city: string | null }) => r.city).filter(Boolean) as string[]));
      return uniq.sort();
    },
  });

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", { search, status, category, listingType, city }],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("id, title, price, city, status, listing_type, category, cover_image_url, is_featured, created_at, owner_id")
        .order("created_at", { ascending: false })
        .limit(200);

      if (status !== "all") q = q.eq("status", status as never);
      if (category !== "all") q = q.eq("category", category as never);
      if (listingType !== "all") q = q.eq("listing_type", listingType as never);
      if (city !== "all") q = q.eq("city", city);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Properties</h1>
        <p className="text-muted-foreground">{properties.length} listing{properties.length === 1 ? "" : "s"}</p>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
          <Select value={listingType} onValueChange={setListingType}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sale & Rent</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : properties.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No properties match your filters</TableCell></TableRow>
            ) : (
              properties.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => openProperty(p.id)}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-muted">
                      {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {p.title}
                    {p.is_featured && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold uppercase">Featured</span>}
                  </TableCell>
                  <TableCell className="capitalize text-sm">{p.listing_type}</TableCell>
                  <TableCell className="capitalize text-sm">{p.category}</TableCell>
                  <TableCell className="text-sm">{p.city ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">₹{Number(p.price).toLocaleString("en-IN")}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openProperty(p.id); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Properties;
