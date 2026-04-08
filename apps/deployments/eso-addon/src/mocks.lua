print = function(...)
  local n = select('#', ...)
  local args = {}
  for i = 1, n do
    args[i] = tostring(select(i, ...))
  end
  console_log(table.concat(args, "\\\\t"))
end

_G.print = print

d = function(...)
  print(...)
end

_G.d = d

_G.CHAT_ROUTER = {
  AddSystemMessage = function(self, message)
    print("SYSTEM:", message)
  end
}

_G.isTesting = 1
print("Mocks Loaded!")
