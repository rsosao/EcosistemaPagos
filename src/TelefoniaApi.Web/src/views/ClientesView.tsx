import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ListIcon, Loader2Icon, SearchIcon, UserPlusIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiGet,
  apiPost,
  apiPut,
  formatoFecha,
  formatoQ,
  type ApiError,
  type Cliente,
  type EstadoCuenta,
} from "@/lib/api";

export function ClientesView() {
  const [nuevoId, setNuevoId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [creando, setCreando] = useState(false);

  const [buscarId, setBuscarId] = useState("");
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [editandoNombre, setEditandoNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [todos, setTodos] = useState<Cliente[]>([]);
  const [cargandoTodos, setCargandoTodos] = useState(false);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoId.trim() || !nuevoNombre.trim()) {
      toast.warning("Completá el número telefónico y el nombre.");
      return;
    }
    setCreando(true);
    try {
      const c = await apiPost<Cliente>("/clientes", {
        idCliente: nuevoId.trim(),
        nombre: nuevoNombre.trim(),
      });
      toast.success(`Cliente ${c.nombre} registrado.`);
      setNuevoId("");
      setNuevoNombre("");
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setCreando(false);
    }
  };

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    if (!buscarId.trim()) {
      toast.warning("Ingresá un número telefónico.");
      return;
    }
    setBuscando(true);
    try {
      const data = await apiGet<EstadoCuenta>(
        `/clientes/${encodeURIComponent(buscarId.trim())}/estado-cuenta`,
      );
      setEstado(data);
      setEditandoNombre(data.nombre);
    } catch (err) {
      setEstado(null);
      toast.error((err as ApiError).message);
    } finally {
      setBuscando(false);
    }
  };

  const actualizar = async () => {
    if (!estado) return;
    if (!editandoNombre.trim()) {
      toast.warning("El nombre no puede estar vacío.");
      return;
    }
    setEditando(true);
    try {
      await apiPut(`/clientes/${encodeURIComponent(estado.idCliente)}`, {
        nombre: editandoNombre.trim(),
      });
      toast.success("Cliente actualizado.");
      setEstado({ ...estado, nombre: editandoNombre.trim() });
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setEditando(false);
    }
  };

  const listarTodos = async () => {
    setCargandoTodos(true);
    try {
      const data = await apiGet<Cliente[]>("/clientes");
      setTodos(data);
      toast.success("Clientes cargados.", { description: `${data.length} registros` });
    } catch (err) {
      toast.error((err as ApiError).message);
    } finally {
      setCargandoTodos(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Registrá nuevos clientes y consultá el estado de cuenta de cualquier número telefónico."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="size-4 text-violet-600" />
              Registrar cliente
            </CardTitle>
            <CardDescription>
              El número telefónico es el identificador único.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={crear}>
              <div className="grid gap-1.5">
                <Label htmlFor="nuevoId">Número telefónico</Label>
                <Input
                  id="nuevoId"
                  placeholder="55551234"
                  value={nuevoId}
                  onChange={(e) => setNuevoId(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nuevoNombre">Nombre completo</Label>
                <Input
                  id="nuevoNombre"
                  placeholder="Juan Pérez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={creando}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                {creando ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <UserPlusIcon className="size-3.5" />
                )}
                Crear cliente
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="size-4 text-violet-600" />
              Estado de cuenta
            </CardTitle>
            <CardDescription>
              Buscá por número telefónico para ver cuotas y saldo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex gap-2" onSubmit={buscar}>
              <Input
                placeholder="Número telefónico"
                value={buscarId}
                onChange={(e) => setBuscarId(e.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={buscando}
              >
                {buscando ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <SearchIcon className="size-3.5" />
                )}
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListIcon className="size-4 text-violet-600" />
            Todos los clientes
          </CardTitle>
          <CardDescription>
            GET <code>/clientes</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" onClick={listarTodos} disabled={cargandoTodos}>
            {cargandoTodos ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SearchIcon className="size-3.5" />
            )}
            Listar todos
          </Button>

          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay datos cargados. Presiona “Listar todos”.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número telefónico</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todos.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.id}</TableCell>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>{formatoFecha(c.fechaRegistro)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {estado ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <CardTitle>{estado.nombre}</CardTitle>
                <CardDescription>
                  Número telefónico {estado.idCliente}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-200"
              >
                Saldo pendiente: {formatoQ(estado.pendiente)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="editarNombre">Actualizar nombre</Label>
                <Input
                  id="editarNombre"
                  value={editandoNombre}
                  onChange={(e) => setEditandoNombre(e.target.value)}
                />
              </div>
              <Button onClick={actualizar} disabled={editando} variant="outline">
                {editando ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : null}
                Guardar
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha pago</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estado.cuotas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground"
                      >
                        Sin cuotas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    estado.cuotas.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.periodo}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatoQ(c.monto)}
                        </TableCell>
                        <TableCell>
                          {c.pagada ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
                              Pagada
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell>{c.metodoPago ?? "—"}</TableCell>
                        <TableCell>{formatoFecha(c.fechaPago)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {c.referencia ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
