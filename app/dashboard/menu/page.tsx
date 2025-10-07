"use client";

import { useState, useEffect } from "react";
import {
  MenuItem,
  supabaseDataService,
} from "@/lib/supabase-data-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state for controlled inputs
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_available: true,
  });

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const items = await supabaseDataService.getMenuItems();
        setMenuItems(items);
      } catch (error) {
        toast.error("Failed to fetch menu items.");
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Update form data when currentMenuItem changes
  useEffect(() => {
    if (currentMenuItem) {
      setFormData({
        name: currentMenuItem.name,
        description: currentMenuItem.description || "",
        price: currentMenuItem.price.toString(),
        category: currentMenuItem.category,
        image_url: currentMenuItem.image_url || "",
        is_available: currentMenuItem.is_available,
      });
    } else {
      // Reset form for new item
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        is_available: true,
      });
    }
  }, [currentMenuItem]);

  const handleOpenSheet = (item?: MenuItem) => {
    setCurrentMenuItem(item || null);
    setIsSheetOpen(true);
  };

  const handleOpenAlert = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setIsAlertOpen(true);
  };

  const handleOpenDialog = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setIsDialogOpen(true);
  };

  const handleCreateOrUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    const description = formData.description.trim();
    const price = parseFloat(formData.price);
    const category = formData.category.trim();
    const image_url = formData.image_url.trim();

    if (!name) {
      toast.error("Name is required.");
      return;
    }

    if (!category) {
      toast.error("Category is required.");
      return;
    }

    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const newMenuItem = {
      name,
      description: description || undefined,
      price,
      category,
      image_url: image_url || undefined,
      is_available: formData.is_available,
    };

    try {
      if (currentMenuItem && currentMenuItem.id) {
        // Update existing item
        const updatedItem = await supabaseDataService.updateMenuItem(currentMenuItem.id, newMenuItem);
        if (updatedItem) {
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === currentMenuItem.id ? updatedItem : item
            )
          );
          toast.success("Menu item updated successfully!");
        } else {
          toast.error("Failed to update menu item.");
        }
      } else {
        // Create new item
        const createdItem = await supabaseDataService.createMenuItem(newMenuItem);
        if (createdItem) {
          setMenuItems((prev) => [...prev, createdItem]);
          toast.success("Menu item created successfully!");
        } else {
          toast.error("Failed to create menu item.");
        }
      }
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("Failed to save menu item.");
      console.error("Error saving menu item:", error);
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!currentMenuItem || !currentMenuItem.id) return;
    try {
      const success = await supabaseDataService.deleteMenuItem(currentMenuItem.id);
      if (success) {
        setMenuItems((prev) =>
          prev.filter((item) => item.id !== currentMenuItem.id)
        );
        toast.success("Menu item deleted successfully!");
      } else {
        toast.error("Failed to delete menu item.");
      }
    } catch (error) {
      toast.error("Failed to delete menu item.");
      console.error("Error deleting menu item:", error);
    } finally {
      setIsAlertOpen(false);
    }
  };

  const columns = [
    {
      key: "name" as const,
      label: "Name",
      render: (value: string, item: MenuItem) => (
        <div>
          <div className="font-medium">{value}</div>
          {item.description && (
            <div className="text-sm text-muted-foreground truncate max-w-48">
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category" as const,
      label: "Category",
      render: (value: string) => (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {value}
        </Badge>
      ),
    },
    {
      key: "price" as const,
      label: "Price",
      render: (value: number) => {
        const formatted = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(value);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      key: "is_available" as const,
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}
              className={value ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                               : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
          {value ? "Available" : "Not Available"}
        </Badge>
      ),
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (value: string, item: MenuItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenSheet(item)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
              Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleOpenAlert(item)}>
              <span className="text-red-500">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Menu Management</CardTitle>
        <CardDescription>
          Manage your restaurant's menu items here.
        </CardDescription>
        <div className="flex justify-end">
          <Button onClick={() => handleOpenSheet()}>
            + Add New Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading menu items...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={menuItems}
            searchKey="name"
            title="Menu Items"
            onAdd={() => handleOpenSheet()}
            addButtonText="Add Item"
          />
        )}
      </CardContent>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {currentMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
            </SheetTitle>
            <SheetDescription>
              {currentMenuItem
                ? "Update the details of the menu item."
                : "Add a new menu item to your list."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreateOrUpdateMenuItem} className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category *
                </Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="col-span-3"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_available" className="text-right">
                  Available
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="is_available"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Item is available for ordering
                  </label>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button type="submit">
                {currentMenuItem ? "Update Item" : "Create Item"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{currentMenuItem?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMenuItem} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentMenuItem?.name}</DialogTitle>
            <DialogDescription>{currentMenuItem?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={currentMenuItem?.image_url || "/placeholder.jpg"}
              alt={currentMenuItem?.name}
              className="h-48 w-48 object-cover rounded-md"
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell>
                    {currentMenuItem?.price ?
                      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(currentMenuItem.price) :
                      "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>{currentMenuItem?.category}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Available</TableCell>
                  <TableCell>
                    <Badge variant={currentMenuItem?.is_available ? "default" : "secondary"}>
                      {currentMenuItem?.is_available ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MenuPage;